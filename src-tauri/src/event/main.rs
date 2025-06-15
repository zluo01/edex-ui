use crate::constant::main::DESTROY_TERMINAL;
use crate::sys::main::{DiskUsage, ProcessInfo, SystemData};
use log::{error, trace};
use serde_json::Value;
use tauri::{AppHandle, Emitter};
use tokio::sync::mpsc;

//TODO: Redesign event later.
#[derive(Debug, Clone)]
pub enum ProcessEvent {
    System { system_data: SystemData },
    Network { network_data: Value },
    Disks { disks_data: Vec<DiskUsage> },
    Process { process_data: Vec<ProcessInfo> },
    Forward { id: u8, data: Vec<u8> }, // Handle Pty Message forwarding
    ProcessExit { id: u8, exit_code: Option<u32> }, // Handle Pty Session Exits
    Closed { id: u8 },                 // Handle Pty Session Exits
}

pub struct EventProcessor {
    event_rx: mpsc::UnboundedReceiver<ProcessEvent>,
    app_handle: AppHandle,
}

impl EventProcessor {
    pub fn new(app_handle: AppHandle) -> (Self, mpsc::UnboundedSender<ProcessEvent>) {
        let (tx, rx) = mpsc::unbounded_channel();

        let processor = Self {
            event_rx: rx,
            app_handle,
        };

        (processor, tx)
    }

    pub async fn run(&mut self) {
        while let Some(event) = self.event_rx.recv().await {
            self.handle_event(event).await
        }
    }

    async fn handle_event(&self, event: ProcessEvent) {
        match event {
            ProcessEvent::Forward { id, data } => {
                self.forward_pty_message(id, &data).await;
            }
            ProcessEvent::ProcessExit { id, exit_code } => {
                self.handle_close(id, exit_code).await;
            }
            ProcessEvent::Closed { id } => {
                self.handle_close(id, None).await;
            }
            ProcessEvent::System { system_data } => {
                self.send_data("system", system_data).await;
            }
            ProcessEvent::Network { network_data } => {
                self.send_data("network", network_data).await;
            }
            ProcessEvent::Disks { disks_data } => {
                self.send_data("disk", disks_data).await;
            }
            ProcessEvent::Process { process_data } => {
                self.send_data("process", process_data).await;
            }
        }
    }

    // Forward output to external systems (websockets, files, etc.)
    async fn forward_pty_message(&self, id: u8, data: &[u8]) {
        if !data.is_empty() {
            let event_key = format!("data-{}", id);
            self.app_handle.emit(&event_key, data).unwrap();
        }
    }

    async fn send_data<T>(&self, event_name: &str, data: T)
    where
        T: serde::Serialize + Clone,
    {
        match self.app_handle.emit(event_name, data) {
            Ok(_) => {}
            Err(e) => error!("Fail to send {} data. Error: {}", event_name, e),
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
