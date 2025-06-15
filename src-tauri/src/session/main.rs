use crate::constant::main::DESTROY_TERMINAL;
use log::{error, trace};
use portable_pty::{native_pty_system, Child, CommandBuilder, MasterPty, PtySize};
use std::collections::HashMap;
use std::io::{BufRead, BufReader, Write};
use std::time::Duration;
use sysinfo::{Pid, ProcessRefreshKind, ProcessesToUpdate, System};
use tauri::async_runtime::JoinHandle;
use tauri::{AppHandle, Emitter};
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

#[derive(Debug, Clone)]
pub enum PtyEvent {
    Output { id: u8, data: Vec<u8> },
    ProcessExit { id: u8, exit_code: Option<u32> },
    Closed { id: u8 },
}

pub struct PtySession {
    pub id: u8,
    pub pid: i32,
    pub master: Box<dyn MasterPty + Send>,
    pub child: Box<dyn Child + Send + Sync>,
    pub reader_handle: JoinHandle<()>,
    pub writer: Box<dyn Write + Send>,
}

pub struct PtySessionManager {
    event_tx: mpsc::UnboundedSender<PtyEvent>,
    active_sessions: HashMap<u8, PtySession>,
}

impl PtySessionManager {
    pub fn new() -> (Self, mpsc::UnboundedReceiver<PtyEvent>) {
        let (tx, rx) = mpsc::unbounded_channel();

        let manager = Self {
            event_tx: tx,
            active_sessions: HashMap::new(),
        };

        (manager, rx)
    }

    // Spawn a new PTY with a command
    pub fn spawn_pty(&mut self, id: u8) -> Result<i32, Box<dyn std::error::Error + Send + Sync>> {
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
        let child = pty_pair.slave.spawn_command(cmd)?;

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
        let tx_reader = self.event_tx.clone();

        // Spawn reader task to continuously read from PTY
        // We must use either spawn_blocking  or `tokio::task::yield_now().await` with async spawn,
        // otherwise, it will prevent mpsc receiver from receiving the event
        let reader_handle = tauri::async_runtime::spawn_blocking(move || loop {
            match reader.fill_buf() {
                Ok(data) if data.len() > 0 => {
                    let data = data.to_vec();
                    reader.consume(data.len());
                    match tx_reader.send(PtyEvent::Output {
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

        // Store the PTY instance
        let pty_instance = PtySession {
            id,
            pid,
            master,
            child,
            reader_handle,
            writer,
        };

        self.active_sessions.insert(id, pty_instance);

        // Spawn a task to monitor process exit
        self.spawn_process_monitor(id);

        Ok(pid)
    }

    // Write data to a specific PTY
    pub fn write_to_pty(
        &mut self,
        id: u8,
        data: &[u8],
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        match self.active_sessions.get_mut(&id) {
            Some(pty_instance) => {
                pty_instance.writer.write(data)?;
                Ok(())
            }
            None => Err(format!("Session {} not found", id).into()),
        }
    }

    // Resize a PTY
    pub fn resize_pty(
        &mut self,
        id: u8,
        size: PtySize,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        match self.active_sessions.get_mut(&id) {
            Some(pty_instance) => {
                pty_instance.master.resize(size)?;
                Ok(())
            }
            None => Err(format!("Session {} not found", id).into()),
        }
    }

    // Monitor process exit status
    fn spawn_process_monitor(&self, id: u8) {
        if let Some(pty_instance) = self.active_sessions.get(&id) {
            let tx = self.event_tx.clone();
            let pid = pty_instance.pid;

            tauri::async_runtime::spawn_blocking(move || {
                let mut system = System::new();
                let sysinfo_pid = Pid::from_u32(pid as u32);

                loop {
                    std::thread::sleep(Duration::from_secs(1));

                    system.refresh_processes_specifics(
                        ProcessesToUpdate::Some(&[sysinfo_pid]),
                        true,
                        ProcessRefreshKind::nothing(),
                    );

                    if system.process(sysinfo_pid).is_some() {
                        continue;
                    } else {
                        match tx.send(PtyEvent::ProcessExit {
                            id,
                            exit_code: None,
                        }) {
                            Ok(()) => {}
                            Err(e) => error!("Fail to send process exit evnet. {:?}", e),
                        }
                        break;
                    }
                }
            });
        }
    }

    // Kill a PTY and its process
    pub fn kill_pty(&mut self, id: u8) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        match self.active_sessions.remove(&id) {
            Some(mut pty_instance) => {
                // Kill the child process
                pty_instance.child.kill()?;

                // Cancel the reader task
                pty_instance.reader_handle.abort();

                // Send closed event
                match self.event_tx.send(PtyEvent::Closed { id }) {
                    Ok(_) => {}
                    Err(e) => error!("Fail to send close event message. Error: {:?}", e),
                };

                Ok(())
            }
            None => Err(format!("Session {} not found", id).into()),
        }
    }

    pub fn get_pid(&self, id: u8) -> Result<i32, Box<dyn std::error::Error + Send + Sync>> {
        match self.active_sessions.get(&id) {
            Some(pty_instance) => Ok(pty_instance.pid),
            None => Err(format!("Session {} not found", id).into()),
        }
    }
}

pub struct PtyEventProcessor {
    event_rx: mpsc::UnboundedReceiver<PtyEvent>,
    app_handle: AppHandle,
}

impl PtyEventProcessor {
    pub fn new(rx: mpsc::UnboundedReceiver<PtyEvent>, app_handle: AppHandle) -> Self {
        Self {
            event_rx: rx,
            app_handle,
        }
    }

    pub async fn run(&mut self) {
        while let Some(event) = self.event_rx.recv().await {
            self.handle_event(event).await
        }
    }

    async fn handle_event(&self, event: PtyEvent) {
        match event {
            PtyEvent::Output { id, data } => {
                self.forward_output(id, &data).await;
            }
            PtyEvent::ProcessExit { id, exit_code } => {
                self.handle_close(id, exit_code).await;
            }
            PtyEvent::Closed { id } => {
                self.handle_close(id, None).await;
            }
        }
    }

    // Forward output to external systems (websockets, files, etc.)
    async fn forward_output(&self, id: u8, data: &[u8]) {
        if !data.is_empty() {
            let event_key = format!("data-{}", id);
            self.app_handle.emit(&event_key, data).unwrap();
        }
    }

    async fn handle_close(&self, id: u8, exit_code: Option<u32>) {
        trace!("Exit status {:?}. Id: {}", &exit_code, &id);

        // exit the application if exit on the main terminal
        if 0u8 == id {
            self.app_handle.exit(exit_code.unwrap_or(0) as i32);
            return;
        }

        // notify UI to remove the terminal
        trace!("Destroy terminal {}.", id);
        self.app_handle.emit(DESTROY_TERMINAL, id).unwrap();
    }
}
