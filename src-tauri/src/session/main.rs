use crate::event::main::ProcessEvent;
use crate::file::main::{DirectoryWatcherEvent, WatcherPayload};
use dashmap::DashMap;
use log::error;
use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use serde::{Deserialize, Serialize};
use std::io::{BufRead, BufReader, Write};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Listener};
use tokio::sync::mpsc;

fn construct_cmd() -> CommandBuilder {
    #[cfg(target_os = "macos")]
    let mut cmd = CommandBuilder::new("zsh");
    #[cfg(target_os = "linux")]
    let mut cmd = CommandBuilder::new("bash");

    cmd.args(&["-l"]);
    cmd.env("TERM", "xterm-256color");
    cmd.env("COLORTERM", "truecolor");
    cmd.env("TERM_PROGRAM", "eDEX-UI");
    cmd.env("TERM_PROGRAM_VERSION", "1.0.0");

    for var in ["HOME", "USER", "SHELL", "PATH", "LANG"] {
        if let Ok(val) = std::env::var(var) {
            cmd.env(var, val);
        }
    }

    cmd
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
enum PtySessionCommand {
    Write { data: String },
    Resize { cols: u16, rows: u16 },
}

struct PtySession {
    pid: i32,
}

impl PtySession {
    pub fn new<F>(
        id: &String,
        process_event_sender: mpsc::UnboundedSender<ProcessEvent>,
        app_handle: AppHandle,
        cleanup: F,
    ) -> Result<Self, Box<dyn std::error::Error + Send + Sync>>
    where
        F: FnOnce() + Send + 'static,
    {
        let pty_size = PtySize {
            rows: 24,
            cols: 80,
            pixel_width: 0,
            pixel_height: 0,
        };

        let pty_system = native_pty_system();
        let pty_pair = pty_system.openpty(pty_size)?;

        // Spawn the child process
        let cmd = construct_cmd();
        let mut child = pty_pair.slave.spawn_command(cmd)?;

        // Release any handles owned by the slave: we don't need it now
        // that we've spawned the child.
        drop(pty_pair.slave);

        let master = pty_pair.master;

        let pid = master.process_group_leader().expect("Fail to get pid.");

        // Get reader and writer from master
        let pty_reader = master.try_clone_reader()?;
        let mut reader = BufReader::new(pty_reader);
        let writer = master.take_writer()?;

        // Clone sender for the reader task
        let pty_reader_sender = process_event_sender.clone();
        let id_for_reader = id.clone();

        // Spawn reader task to continuously read from PTY
        // We must use either spawn_blocking  or `tokio::task::yield_now().await` with async spawn,
        // otherwise, it will prevent mpsc receiver from receiving the event
        let reader_handle = tauri::async_runtime::spawn_blocking(move || loop {
            match reader.fill_buf() {
                Ok(data) if data.len() > 0 => {
                    let data = data.to_vec();
                    reader.consume(data.len());
                    if let Err(e) = pty_reader_sender.send(ProcessEvent::Forward {
                        id: id_for_reader.clone(),
                        data,
                    }) {
                        error!("Fail to send output. {:?}", e);
                    }
                }
                Ok(_) => {
                    // ✅ EOF reached - exit loop
                    break;
                }
                Err(e) => {
                    error!(
                        "Error when reading from pty for session {}: Error: {}",
                        id_for_reader, e
                    );
                    break;
                }
            }
        });

        let writer = Arc::new(Mutex::new(writer));
        let master = Arc::new(Mutex::new(master));
        let event_id = app_handle.listen(id.clone(), move |event| {
            match serde_json::from_str::<PtySessionCommand>(event.payload()) {
                Ok(PtySessionCommand::Write { data }) => {
                    let mut w = writer.lock().unwrap(); // Clone avoided
                    if let Err(e) = w.write(data.as_bytes()) {
                        error!("Failed to write to session: {:?}", e);
                    }
                }
                Ok(PtySessionCommand::Resize { cols, rows }) => {
                    let size = PtySize {
                        rows,
                        cols,
                        ..Default::default()
                    };
                    let m = master.lock().unwrap(); // Clone avoided
                    if let Err(e) = m.resize(size) {
                        error!("Failed to resize session: {:?}", e);
                    }
                }
                Err(e) => {
                    error!("Failed to parse command: {:?}", e);
                }
            }
        });

        let id_for_exit = id.clone();
        let app_handle_for_cleanup = app_handle;
        let child_watcher_sender = process_event_sender.clone();
        // need to use block here since child.wait is a blocking process
        tauri::async_runtime::spawn_blocking(move || {
            let exit_code = match child.wait() {
                Ok(status) => Some(status.exit_code()),
                Err(e) => {
                    error!("Failed to wait for child process: {:?}", e);
                    None
                }
            };
            reader_handle.abort();
            app_handle_for_cleanup.unlisten(event_id);
            if let Err(e) = child_watcher_sender.send(ProcessEvent::ProcessExit {
                id: id_for_exit,
                exit_code,
            }) {
                error!("Fail to send process exit event. {:?}", e);
            }
            cleanup();
        });

        Ok(Self { pid })
    }

    pub fn pid(&self) -> i32 {
        self.pid
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type", content = "payload")]
enum PtySessionManagerCommand {
    Initialize { id: String },
    Switch { id: String },
}

pub struct PtySessionManager {
    process_event_sender: mpsc::UnboundedSender<ProcessEvent>,
    directory_file_watcher_event_sender: mpsc::UnboundedSender<DirectoryWatcherEvent>,
    active_sessions: Arc<DashMap<String, PtySession>>,
}

impl PtySessionManager {
    pub fn new(
        process_event_sender: mpsc::UnboundedSender<ProcessEvent>,
        directory_file_watcher_event_sender: mpsc::UnboundedSender<DirectoryWatcherEvent>,
    ) -> Self {
        Self {
            process_event_sender,
            directory_file_watcher_event_sender,
            active_sessions: Arc::new(DashMap::new()),
        }
    }

    pub fn start(&mut self, app_handle: AppHandle) {
        let active_sessions = self.active_sessions.clone();
        let process_event_sender = self.process_event_sender.clone();
        let directory_file_watcher_sender = self.directory_file_watcher_event_sender.clone();
        let app_handle_clone = app_handle.clone();

        app_handle.listen("manager", move |event| {
            match serde_json::from_str::<PtySessionManagerCommand>(event.payload()) {
                Ok(PtySessionManagerCommand::Initialize { id }) => {
                    Self::spawn_pty(
                        &id,
                        &active_sessions,
                        &process_event_sender,
                        &directory_file_watcher_sender,
                        &app_handle_clone,
                    );
                }
                Ok(PtySessionManagerCommand::Switch { id }) => {
                    Self::switch_session(&id, &active_sessions, &directory_file_watcher_sender);
                }
                Err(e) => {
                    error!("Failed to parse command for session manager: {:?}", e);
                }
            }
        });
    }

    fn spawn_pty(
        id: &String,
        active_sessions: &Arc<DashMap<String, PtySession>>,
        process_event_sender: &mpsc::UnboundedSender<ProcessEvent>,
        directory_file_watcher_sender: &mpsc::UnboundedSender<DirectoryWatcherEvent>,
        app_handle: &AppHandle,
    ) {
        let active_sessions_inner = active_sessions.clone();
        let directory_watcher_inner = directory_file_watcher_sender.clone();
        let id_for_cleanup = id.clone();
        let app_handle_for_cleanup = app_handle.clone();

        let pty_session_result = PtySession::new(
            id,
            process_event_sender.clone(),
            app_handle.clone(),
            move || {
                if let Err(e) =
                    directory_watcher_inner.send(DirectoryWatcherEvent::Watch { initial: None })
                {
                    error!(
                        "Fail to send directory update event on session close. {:?}",
                        e
                    )
                }
                active_sessions_inner.remove(&id_for_cleanup);

                // user closed all sessions, we should exit the app now.
                if active_sessions_inner.is_empty() {
                    app_handle_for_cleanup.exit(0i32);
                }
            },
        );

        match pty_session_result {
            Ok(pty_session) => {
                let pid = pty_session.pid();
                active_sessions.insert(id.clone(), pty_session);

                if let Err(e) = directory_file_watcher_sender.send(DirectoryWatcherEvent::Watch {
                    initial: Some(WatcherPayload::new(pid)),
                }) {
                    error!("Fail to send directory update event. {:?}", e);
                }
            }
            Err(e) => {
                error!("Failed to initialize new session: {:?}", e);
            }
        }
    }

    fn switch_session(
        id: &String,
        active_sessions: &Arc<DashMap<String, PtySession>>,
        directory_file_watcher_sender: &mpsc::UnboundedSender<DirectoryWatcherEvent>,
    ) {
        match active_sessions.get(id) {
            Some(pty_session) => {
                if let Err(e) = directory_file_watcher_sender.send(DirectoryWatcherEvent::Watch {
                    initial: Some(WatcherPayload::new(pty_session.pid())),
                }) {
                    error!("Fail to send directory update event. {:?}", e);
                }
            }
            None => {
                error!("Session {} not found on switching", id);
            }
        }
    }
}
