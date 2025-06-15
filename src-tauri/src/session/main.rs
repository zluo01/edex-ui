use crate::event::main::ProcessEvent;
use log::error;
use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};
use std::collections::HashMap;
use std::io::{BufRead, BufReader, Write};
use std::sync::{Arc, Mutex};
use std::time::Duration;
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

pub struct PtySession {
    pid: i32,
    master: Box<dyn MasterPty + Send>,
    writer: Box<dyn Write + Send>,
}

impl PtySession {
    pub fn new<F>(
        id: u8,
        event_tx: mpsc::UnboundedSender<ProcessEvent>,
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
        let pty_reader_sender = event_tx.clone();

        // Spawn reader task to continuously read from PTY
        // We must use either spawn_blocking  or `tokio::task::yield_now().await` with async spawn,
        // otherwise, it will prevent mpsc receiver from receiving the event
        let reader_handle = tauri::async_runtime::spawn_blocking(move || loop {
            match reader.fill_buf() {
                Ok(data) if data.len() > 0 => {
                    let data = data.to_vec();
                    reader.consume(data.len());
                    match pty_reader_sender.send(ProcessEvent::Forward {
                        id,
                        data: data.to_vec(),
                    }) {
                        Ok(()) => {}
                        Err(e) => error!("Fail to send output. {:?}", e),
                    }
                }
                Ok(_) => {
                    std::thread::sleep(Duration::from_millis(1));
                }
                Err(e) => {
                    error!(
                        "Error when reading from pty for session {}: Error: {}",
                        id, e
                    );
                    break;
                }
            }
        });

        let child_watcher_sender = event_tx.clone();
        // need to use block here since child.wait is a blocking process
        tauri::async_runtime::spawn_blocking(move || {
            let status = child.wait().unwrap();
            let exit_code = status.exit_code();
            reader_handle.abort();
            cleanup();
            match child_watcher_sender.send(ProcessEvent::ProcessExit {
                id,
                exit_code: Some(exit_code),
            }) {
                Ok(()) => {}
                Err(e) => error!("Fail to send process exit event. {:?}", e),
            }
        });

        Ok(Self {
            pid,
            master,
            writer,
        })
    }

    pub fn pid(&self) -> i32 {
        self.pid
    }

    pub fn write_to_pty(
        &mut self,
        data: &[u8],
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        self.writer.write(data)?;
        Ok(())
    }

    pub fn resize_pty(
        &mut self,
        size: PtySize,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        self.master.resize(size)?;
        Ok(())
    }
}

pub struct PtySessionManager {
    event_tx: mpsc::UnboundedSender<ProcessEvent>,
    active_sessions: Arc<Mutex<HashMap<u8, PtySession>>>,
}

impl PtySessionManager {
    pub fn new(tx: mpsc::UnboundedSender<ProcessEvent>) -> Self {
        Self {
            event_tx: tx,
            active_sessions: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    // Spawn a new PTY with a command
    pub fn spawn_pty(&mut self, id: u8) -> Result<i32, Box<dyn std::error::Error + Send + Sync>> {
        let active_sessions = self.active_sessions.clone();
        let pty_session = PtySession::new(id, self.event_tx.clone(), move || {
            active_sessions.lock().unwrap().remove(&id);
        })?;

        let pid = pty_session.pid();
        self.active_sessions.lock().unwrap().insert(id, pty_session);

        Ok(pid)
    }

    // Write data to a specific PTY
    pub fn write(
        &mut self,
        id: u8,
        data: &[u8],
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        match self.active_sessions.lock().unwrap().get_mut(&id) {
            Some(pty_instance) => {
                pty_instance.write_to_pty(data)?;
                Ok(())
            }
            None => Err(format!("Session {} not found", id).into()),
        }
    }

    // Resize a PTY
    pub fn resize(
        &mut self,
        id: u8,
        size: PtySize,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        match self.active_sessions.lock().unwrap().get_mut(&id) {
            Some(pty_instance) => {
                pty_instance.resize_pty(size)?;
                Ok(())
            }
            None => Err(format!("Session {} not found", id).into()),
        }
    }

    pub fn get_pid(&self, id: u8) -> Result<i32, Box<dyn std::error::Error + Send + Sync>> {
        match self.active_sessions.lock().unwrap().get(&id) {
            Some(pty_session) => Ok(pty_session.pid()),
            None => Err(format!("Session {} not found", id).into()),
        }
    }
}
