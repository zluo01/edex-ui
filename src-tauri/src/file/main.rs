use crate::event::main::ProcessEvent;
use log::error;
use notify::{recommended_watcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use std::{cmp::Ordering, fs, path::PathBuf, str};
use tokio::sync::mpsc;

// Borrow from https://github.com/hharnisc/hypercwd/blob/master/setCwd.js
pub fn get_current_pty_cwd(pid: i32) -> Option<String> {
    let response = std::process::Command::new("lsof")
        .args(&["-a", "-p", &pid.to_string(), "-d", "cwd", "-Fn"])
        .output();

    if let Err(e) = response {
        error!("Fail to run command. Error: {}", e);
        return None;
    }

    let output = response.unwrap();
    if output.status.success() {
        let lines = str::from_utf8(&output.stdout).expect("Invalid UTF-8");
        let cwd = lines.lines().last().unwrap().get(1..).unwrap();
        Some(cwd.to_string())
    } else {
        error!("Command failed with error: {:?}", output.status);
        None
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
enum FileType {
    Directory,
    File,
    SystemLink,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct FileInfo {
    name: String,
    t: FileType,
    path: String,
    hidden: bool,
}

impl Ord for FileInfo {
    fn cmp(&self, other: &Self) -> Ordering {
        match (&self.t, &other.t) {
            (FileType::Directory, FileType::Directory) => {
                // Sort hidden directories first by comparing the hidden flag
                if self.hidden && !other.hidden {
                    Ordering::Less
                } else if !self.hidden && other.hidden {
                    Ordering::Greater
                } else {
                    self.name.cmp(&other.name)
                }
            }
            (FileType::Directory, FileType::File) => Ordering::Less,
            (FileType::File, FileType::Directory) => Ordering::Greater,
            (FileType::File, FileType::File) | (FileType::SystemLink, FileType::SystemLink) => {
                // Sort hidden files/links first by comparing the hidden flag
                if self.hidden && !other.hidden {
                    Ordering::Less
                } else if !self.hidden && other.hidden {
                    Ordering::Greater
                } else {
                    self.name.cmp(&other.name)
                }
            }
            (FileType::SystemLink, _) => Ordering::Less,
            (_, FileType::SystemLink) => Ordering::Greater,
        }
    }
}

impl PartialOrd for FileInfo {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Eq for FileInfo {}

impl PartialEq for FileInfo {
    fn eq(&self, other: &Self) -> bool {
        self.name == other.name && self.t == other.t
    }
}

fn convert_path_to_string(path: &PathBuf, is_directory: bool) -> String {
    let path_str = path.to_string_lossy().to_string();
    if is_directory && !path_str.ends_with('/') {
        return path_str + "/";
    }
    path_str
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DirectoryInfo {
    path: String,
    files: Vec<FileInfo>,
}

impl Default for DirectoryInfo {
    fn default() -> Self {
        Self {
            path: String::new(),
            files: Vec::new(),
        }
    }
}

impl DirectoryInfo {
    fn new(path: String, files: Vec<FileInfo>) -> Self {
        Self { path, files }
    }
}

fn scan_directory(
    path: &PathBuf,
) -> Result<DirectoryInfo, Box<dyn std::error::Error + Send + Sync>> {
    let entries = fs::read_dir(path)?;
    let mut file_info_list: Vec<FileInfo> = Vec::new();

    for entry in entries {
        if let Ok(entry) = entry {
            let file_name = entry.file_name();
            let file_path = entry.path();
            let metadata = entry.metadata();

            if let (Some(name), Ok(metadata)) = (file_name.to_str(), metadata) {
                let file_type = if metadata.is_dir() {
                    FileType::Directory
                } else if metadata.is_file() {
                    FileType::File
                } else {
                    FileType::SystemLink
                };

                file_info_list.push(FileInfo {
                    name: name.to_string(),
                    t: file_type,
                    path: convert_path_to_string(&file_path, metadata.is_dir()),
                    hidden: name.starts_with("."),
                });
            }
        }
    }
    file_info_list.sort();

    Ok(DirectoryInfo::new(
        path.to_string_lossy().to_string(),
        file_info_list,
    ))
}

#[derive(Debug, Clone)]
pub struct WatcherPathInfo {
    pid: i32, // only use in mac
    initial_path: String,
}

impl WatcherPathInfo {
    pub fn new(pid: i32, initial_path: String) -> Self {
        Self { pid, initial_path }
    }
}

#[derive(Debug, Clone)]
pub enum DirectoryWatcherEvent {
    Watch { initial: Option<WatcherPathInfo> },
}

pub struct DirectoryFileWatcher {
    directory_file_watcher_sender: mpsc::UnboundedSender<DirectoryWatcherEvent>, // only use in mac
    directory_file_watcher_receiver: mpsc::UnboundedReceiver<DirectoryWatcherEvent>,
    process_event_sender: mpsc::UnboundedSender<ProcessEvent>,
    current_path: Option<String>,
}

impl DirectoryFileWatcher {
    pub fn new(
        event_tx: mpsc::UnboundedSender<ProcessEvent>,
    ) -> (Self, mpsc::UnboundedSender<DirectoryWatcherEvent>) {
        let (tx, rx) = mpsc::unbounded_channel();

        let watcher = Self {
            directory_file_watcher_sender: tx.clone(),
            directory_file_watcher_receiver: rx,
            process_event_sender: event_tx,
            current_path: None,
        };

        (watcher, tx)
    }

    pub async fn run(&mut self) {
        let file_watcher_event_sender = self.process_event_sender.clone();
        let mut file_path_watcher =
            recommended_watcher(move |res: notify::Result<notify::Event>| match res {
                Ok(event) => {
                    if event.kind.is_create() || event.kind.is_modify() || event.kind.is_remove() {
                        let path = event.paths[0].parent().unwrap().to_path_buf();
                        Self::update_directory(&path, &file_watcher_event_sender);
                    }
                }
                Err(e) => error!("watch error: {:?}", e),
            })
                .unwrap();

        let file_watcher_event_sender = self.process_event_sender.clone();
        while let Some(event) = self.directory_file_watcher_receiver.recv().await {
            match event {
                DirectoryWatcherEvent::Watch { initial } => {
                    // make sure we only watch one path at a time
                    // we also need to reset the current_path such that if something happens
                    // we do not double unwatch for the new life cycle
                    if let Some(ref path) = self.current_path {
                        match file_path_watcher.unwatch(&PathBuf::from(path)) {
                            Ok(_) => self.current_path = None,
                            Err(e) => error!("Fail to unwatch path: {}. Error: {}", path, e),
                        }
                    }

                    // if no info, meaning current pty is closed. We will reset and wait for the next open pty to watch
                    if initial.is_none() {
                        match &file_watcher_event_sender.send(ProcessEvent::Directory {
                            directory_info: DirectoryInfo::default(),
                        }) {
                            Ok(()) => {}
                            Err(e) => error!("Fail to update files. {:?}", e),
                        };
                        continue;
                    }

                    let info = initial.unwrap();
                    let new_path = info.initial_path;

                    let pid = info.pid;
                    let prev_cwd = new_path.clone();
                    let event_sender = self.directory_file_watcher_sender.clone();
                    tauri::async_runtime::spawn_blocking(move || {
                        loop {
                            std::thread::sleep(std::time::Duration::from_millis(500));

                            // Get current pty cwd
                            match get_current_pty_cwd(pid) {
                                None => {
                                    error!("Fail to get cwd for pid {}.", &pid);
                                    // since this thread is running in parallel with terminal thread, and we rely on event loop to update path to watch
                                    // there is possible race condition that we get the pid in current cycle while at the meantime, the terminal is closed in other thread
                                    // in this case, the current pid in this cycle will not have cwd.
                                    // We will just break the current thread and let the workflow create a new one.
                                    break;
                                }
                                Some(cwd) => {
                                    if cwd != prev_cwd {
                                        if let Err(e) =
                                            event_sender.send(DirectoryWatcherEvent::Watch {
                                                initial: Some(WatcherPathInfo::new(pid, cwd)),
                                            })
                                        {
                                            error!("Fail to send update path. {}", e)
                                        }
                                        break;
                                    }
                                    continue;
                                }
                            }
                        }
                    });

                    let proc_path = PathBuf::from(&new_path);

                    match file_path_watcher.watch(&proc_path, RecursiveMode::NonRecursive) {
                        Ok(_) => {
                            self.current_path = Some(new_path);
                            Self::update_directory(&proc_path, &file_watcher_event_sender);
                        }
                        Err(e) => error!("Fail to watch path: {}. Error: {}", new_path, e),
                    }
                }
            }
        }
    }

    fn update_directory(path: &PathBuf, event_tx: &mpsc::UnboundedSender<ProcessEvent>) {
        match scan_directory(path) {
            Ok(directory_info) => {
                match event_tx.send(ProcessEvent::Directory { directory_info }) {
                    Ok(()) => {}
                    Err(e) => error!("Fail to update files. {:?}", e),
                };
            }
            Err(e) => error!("Fail to scan directory. Error: {}", e),
        }
    }
}
