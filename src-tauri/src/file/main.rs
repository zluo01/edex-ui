use crate::event::main::ProcessEvent;
use log::error;
use notify::{recommended_watcher, RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::{cmp::Ordering, fs, path::PathBuf, str};
use tokio::sync::{mpsc, Mutex, RwLock};

// Borrow from https://github.com/hharnisc/hypercwd/blob/master/setCwd.js
pub async fn get_current_pty_cwd(pid: i32) -> Result<String, String> {
    let response = tokio::process::Command::new("lsof")
        .args(&["-a", "-p", &pid.to_string(), "-d", "cwd", "-Fn"])
        .output()
        .await;

    if let Err(e) = response {
        return Err(format!("Fail to run command. Error: {}", e));
    }

    let output = response.unwrap();
    if output.status.success() {
        let lines = str::from_utf8(&output.stdout).expect("Invalid UTF-8");
        let cwd = lines.lines().last().unwrap().get(1..).unwrap();
        Ok(cwd.to_string())
    } else {
        Err(format!("Command failed with error: {:?}", output.status))
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
pub struct WatcherPayload {
    pid: i32,
}

impl WatcherPayload {
    pub fn new(pid: i32) -> Self {
        Self { pid }
    }
}

#[derive(Debug, Clone)]
pub enum DirectoryWatcherEvent {
    Watch { initial: Option<WatcherPayload> },
}

struct PtyCwdWatcher {
    file_path_watcher: Arc<Mutex<RecommendedWatcher>>,
    pid: Arc<RwLock<Option<i32>>>,
    prev_cwd: Arc<RwLock<Option<String>>>,
}

impl PtyCwdWatcher {
    fn new(file_path_watcher: RecommendedWatcher) -> Self {
        Self {
            file_path_watcher: Arc::new(Mutex::new(file_path_watcher)),
            pid: Arc::new(RwLock::new(None)),
            prev_cwd: Arc::new(RwLock::new(None)),
        }
    }

    async fn start<F>(&mut self, update_directory: F)
    where
        F: Fn(PathBuf) + Send + 'static,
    {
        let pid = Arc::clone(&self.pid);
        let prev_cwd = Arc::clone(&self.prev_cwd);
        let file_watcher = Arc::clone(&self.file_path_watcher);

        tauri::async_runtime::spawn(async move {
            let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(1));
            loop {
                interval.tick().await;

                let current_pid = {
                    let pid_guard = pid.read().await;
                    match *pid_guard {
                        Some(p) => p,
                        None => continue,
                    }
                };

                let prev = {
                    let prev_cwd_guard = prev_cwd.read().await;
                    prev_cwd_guard.clone().unwrap_or_default()
                };

                match get_current_pty_cwd(current_pid).await {
                    Ok(cwd) => {
                        let mut watcher = file_watcher.lock().await;

                        // cwd has changed
                        if cwd != prev {
                            // unwatch the old path first
                            if !prev.is_empty() {
                                match watcher.unwatch(&PathBuf::from(&prev)) {
                                    Ok(_) => {}
                                    Err(e) => {
                                        error!("Fail to unwatch path: {}. Error: {}", prev, e)
                                    }
                                }
                            }

                            let proc_path = PathBuf::from(&cwd);
                            match watcher.watch(&proc_path, RecursiveMode::NonRecursive) {
                                Ok(_) => {
                                    *prev_cwd.write().await = Some(cwd);
                                    update_directory(proc_path); // need to proactively update the directory once to refresh the current data.
                                }
                                Err(e) => error!("Fail to watch path: {}. Error: {}", cwd, e),
                            }
                        }
                        continue;
                    }
                    Err(e) => {
                        error!(
                            "Fail to get cwd for pid {} with error: {}.",
                            &current_pid, e
                        );
                        continue;
                    }
                }
            }
        });
    }

    async fn watch_pid(&self, pid: i32) {
        *self.pid.write().await = Some(pid);
    }

    async fn reset_pid(&self) {
        *self.pid.write().await = None;
    }
}

pub struct DirectoryFileWatcher {
    directory_file_watcher_receiver: mpsc::UnboundedReceiver<DirectoryWatcherEvent>,
    process_event_sender: mpsc::UnboundedSender<ProcessEvent>,
}

impl DirectoryFileWatcher {
    pub fn new(
        event_tx: mpsc::UnboundedSender<ProcessEvent>,
    ) -> (Self, mpsc::UnboundedSender<DirectoryWatcherEvent>) {
        let (tx, rx) = mpsc::unbounded_channel();

        let watcher = Self {
            directory_file_watcher_receiver: rx,
            process_event_sender: event_tx,
        };

        (watcher, tx)
    }

    pub async fn run(&mut self) {
        let file_watcher_event_sender = self.process_event_sender.clone();
        let file_path_watcher =
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

        // start pty cwd watcher
        let mut pty_cwd_watcher = PtyCwdWatcher::new(file_path_watcher);
        let event_sender = self.process_event_sender.clone();
        pty_cwd_watcher
            .start(move |path: PathBuf| {
                Self::update_directory(&path, &event_sender);
            })
            .await;

        while let Some(event) = self.directory_file_watcher_receiver.recv().await {
            match event {
                DirectoryWatcherEvent::Watch { initial } => {
                    // if no info, meaning current pty is closed. We will reset and wait for the next open pty to watch
                    if initial.is_none() {
                        pty_cwd_watcher.reset_pid().await;
                        continue;
                    }

                    let info = initial.unwrap();
                    let pid = info.pid;

                    pty_cwd_watcher.watch_pid(pid).await;
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
