use crate::event::main::ProcessEvent;
use crate::file::main::{DirectoryWatcherEvent, WatcherPayload};
use log::{error, info};
use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{BufRead, BufReader, Write};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Listener};
use tokio::sync::mpsc;

fn construct_cmd() -> CommandBuilder {
    #[cfg(target_os = "macos")]
    let mut cmd = CommandBuilder::new("zsh");
    #[cfg(target_os = "linux")]
    let mut cmd = CommandBuilder::new("bash");

    cmd.env("TERM", "xterm-256color");
    cmd.env("COLORTERM", "truecolor");
    cmd.env("TERM_PROGRAM", "eDEX-UI");
    cmd.env("TERM_PROGRAM_VERSION", "1.0.0");

    cmd
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum PtySessionCommand {
    Write { data: String },
    Resize { cols: u16, rows: u16 },
}

pub struct PtySession {
    pid: i32,
}

impl PtySession {
    pub fn new<F>(
        id: u8,
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

        // Spawn reader task to continuously read from PTY
        // We must use either spawn_blocking  or `tokio::task::yield_now().await` with async spawn,
        // otherwise, it will prevent mpsc receiver from receiving the event
        let reader_handle = tauri::async_runtime::spawn_blocking(move || loop {
            match reader.fill_buf() {
                Ok(data) if data.len() > 0 => {
                    let data = data.to_vec();
                    reader.consume(data.len());
                    if let Err(e) = pty_reader_sender.send(ProcessEvent::Forward {
                        id,
                        data: data.to_vec(),
                    }) {
                        error!("Fail to send output. {:?}", e);
                    }
                }
                Ok(_) => {}
                Err(e) => {
                    error!(
                        "Error when reading from pty for session {}: Error: {}",
                        id, e
                    );
                    break;
                }
            }
        });

        let child_watcher_sender = process_event_sender.clone();
        // need to use block here since child.wait is a blocking process
        tauri::async_runtime::spawn_blocking(move || {
            let status = child.wait().unwrap();
            let exit_code = status.exit_code();
            reader_handle.abort();
            cleanup();
            if let Err(e) = child_watcher_sender.send(ProcessEvent::ProcessExit {
                id,
                exit_code: Some(exit_code),
            }) {
                error!("Fail to send process exit event. {:?}", e);
            }
        });

        let event_id = format!("terminal-{}", id);

        let writer = Arc::new(Mutex::new(writer));
        let master = Arc::new(Mutex::new(master));
        app_handle.listen(event_id, move |event| {
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

        Ok(Self { pid })
    }

    pub fn pid(&self) -> i32 {
        self.pid
    }
}

pub struct PtySessionManager {
    app_handle: AppHandle,
    process_event_sender: mpsc::UnboundedSender<ProcessEvent>,
    directory_file_watcher_event_sender: mpsc::UnboundedSender<DirectoryWatcherEvent>,
    active_sessions: Arc<Mutex<HashMap<u8, PtySession>>>,
}

impl PtySessionManager {
    pub fn new(
        app_handle: AppHandle,
        process_event_sender: mpsc::UnboundedSender<ProcessEvent>,
        directory_file_watcher_event_sender: mpsc::UnboundedSender<DirectoryWatcherEvent>,
    ) -> Self {
        Self {
            app_handle,
            process_event_sender,
            directory_file_watcher_event_sender,
            active_sessions: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    // Spawn a new PTY with a command
    pub fn spawn_pty(&mut self, id: u8) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let active_sessions = self.active_sessions.clone();

        let directory_file_watcher_sender = self.directory_file_watcher_event_sender.clone();
        let pty_session = PtySession::new(
            id,
            self.process_event_sender.clone(),
            self.app_handle.clone(),
            move || {
                if let Err(e) = directory_file_watcher_sender
                    .send(DirectoryWatcherEvent::Watch { initial: None })
                {
                    error!(
                        "Fail to send directory update event on session close. {:?}",
                        e
                    )
                }
                active_sessions.lock().unwrap().remove(&id);
            },
        )?;

        let pid = pty_session.pid();
        self.active_sessions.lock().unwrap().insert(id, pty_session);

        // signal the watcher to watch new pty directory
        if let Err(e) =
            self.directory_file_watcher_event_sender
                .send(DirectoryWatcherEvent::Watch {
                    initial: Some(WatcherPayload::new(pid)),
                })
        {
            error!("Fail to send directory update event. {:?}", e);
        }

        Ok(())
    }

    pub fn switch_session(&self, id: u8) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        match self.active_sessions.lock().unwrap().get(&id) {
            Some(pty_session) => {
                if let Err(e) =
                    self.directory_file_watcher_event_sender
                        .send(DirectoryWatcherEvent::Watch {
                            initial: Some(WatcherPayload::new(pty_session.pid())),
                        })
                {
                    error!("Fail to send directory update event. {:?}", e);
                }
                Ok(())
            }
            None => Err(format!("Session {} not found on switching", id).into()),
        }
    }
}
