#![cfg_attr(
all(not(debug_assertions), target_os = "windows"),
windows_subsystem = "windows"
)]

mod sys;
mod path;
mod session;

extern crate core;

use std::{
    sync::Arc,
    time::Duration,
    io::{BufRead, BufReader, Write},
};
use serde_json::Value;
use log::{debug, error};
use tauri::{Manager, Runtime};
use sysinfo::{System, SystemExt};
use crate::sys::main::{IPInformation, extract_cpu_data, extract_disk_usage, extract_memory, extract_network, extract_process};
use crate::path::main::{get_current_pty_cwd, scan_directory};

use tauri::{async_runtime::Mutex as AsyncMutex, State};

use portable_pty::{CommandBuilder, native_pty_system, PtySize, PtyPair};
use serde_json::json;
use tokio::time::Instant;

struct TerminalState {
    pty_pair: Arc<AsyncMutex<PtyPair>>,
    writer: Arc<AsyncMutex<Box<dyn Write + Send>>>,
}

struct RequestClientState {
    client: Arc<AsyncMutex<reqwest::Client>>,
}

#[tauri::command]
async fn get_ip_information(request_client_state: State<'_, RequestClientState>) -> Result<Value, ()> {
    let client = request_client_state.client.lock().await;
    let resp = client.get("http://ip-api.com/json/?fields=status,countryCode,region,city,query")
        .send()
        .await;

    if let Err(e) = resp {
        error!("Fail to make request. Error: {:}", &e);
        return Err(());
    }

    let data = resp.unwrap().json::<IPInformation>()
        .await;

    if let Err(e) = data {
        error!("Fail to get response data. Error: {:}", e);
        return Err(());
    }

    let information = data.unwrap();
    if information.is_fail() {
        return Err(());
    }

    Ok(information.to_json())
}

#[tauri::command]
async fn get_network_latency(request_client_state: State<'_, RequestClientState>) -> Result<u128, ()> {
    let client = request_client_state.client.lock().await;

    let start_time = Instant::now();
    let _ = client.get("https://1.1.1.1/dns-query?name=google.com")
        .header("accept", "application/dns-json")
        .send()
        .await;

    let elapsed_time = Instant::now().duration_since(start_time);

    Ok(elapsed_time.as_millis())
}

#[tauri::command]
async fn async_write_to_pty<R: Runtime>(app_handle: tauri::AppHandle<R>,
                                        terminal_state: State<'_, TerminalState>,
                                        data: &str) -> Result<(), ()> {
    write!(terminal_state.writer.lock().await, "{}", data).map_err(|e| error!("Error on write to pty. Error: {:?}", e))
}

#[tauri::command]
async fn async_resize_pty(rows: u16, cols: u16, state: State<'_, TerminalState>) -> Result<(), ()> {
    state.pty_pair
        .lock()
        .await
        .master
        .resize(PtySize {
            rows,
            cols,
            ..Default::default()
        })
        .map_err(|e| error!("Error on resize pty. Error: {:?}", e))
}

fn main() {
    let pty_system = native_pty_system();

    let pty_pair = pty_system
        .openpty(PtySize {
            rows: 24,
            cols: 80,
            pixel_width: 0,
            pixel_height: 0,
        })
        .unwrap();

    #[cfg(target_os = "macos")]
        let mut cmd = CommandBuilder::new("zsh");
    #[cfg(target_os = "linux")]
        let mut cmd = CommandBuilder::new("bash");

    cmd.env("TERM", "xterm-256color");
    cmd.env("COLORTERM", "truecolor");
    cmd.env("TERM_PROGRAM", "eDEX-UI");
    cmd.env("TERM_PROGRAM_VERSION", "1.0.0");

    let mut child = pty_pair.slave.spawn_command(cmd).unwrap();

    let reader = pty_pair.master.try_clone_reader().unwrap();
    let writer = pty_pair.master.take_writer().unwrap();

    let reader = Arc::new(AsyncMutex::new(Some(BufReader::new(reader))));

    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .on_page_load(move |window, _| {
            let window = window.clone();
            let reader = reader.clone();

            tauri::async_runtime::spawn(async move {
                let reader = reader.lock().await.take();
                let mut interval = tokio::time::interval(Duration::from_millis(1));
                if let Some(mut reader) = reader {
                    loop {
                        interval.tick().await;
                        let data = reader.fill_buf().unwrap().to_vec();
                        reader.consume(data.len());
                        if data.len() > 0 {
                            window.emit("data", data).unwrap();
                        }
                    }
                }
            });
        })
        .manage(TerminalState {
            pty_pair: Arc::new(AsyncMutex::new(pty_pair)),
            writer: Arc::new(AsyncMutex::new(writer)),
        })
        .manage(RequestClientState {
            client: Arc::new(AsyncMutex::new(reqwest::Client::new()))
        })
        .invoke_handler(tauri::generate_handler![
            get_ip_information,
            get_network_latency,
            async_write_to_pty,
            async_resize_pty
        ])
        .setup(move |app| {
            // updating and emitting system information
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let state: State<TerminalState> = app_handle.state::<TerminalState>();
                let pty = state.pty_pair.lock().await;
                let pty_pid: i32 = pty.master.process_group_leader().expect("Fail to get pid for pty.");

                let mut sys = System::new_all();

                let mut interval = tokio::time::interval(Duration::from_secs(1));
                loop {
                    interval.tick().await;
                    sys.refresh_all();

                    // Emit information
                    let _ = app_handle.emit_all("uptime", &sys.uptime());
                    let _ = app_handle.emit_all("memory", extract_memory(&sys));
                    let _ = app_handle.emit_all("load", extract_cpu_data(&sys));
                    let _ = app_handle.emit_all("network", extract_network(&sys));
                    let _ = app_handle.emit_all("disk", extract_disk_usage(&sys));

                    let processes = extract_process(&sys);
                    let _ = app_handle.emit_all("process", json!(&processes));
                    let _ = app_handle.emit_all("process_short", json!(processes.iter().take(10).cloned().collect::<Vec<_>>()));

                    // Get current pty cwd
                    let current_cwd = get_current_pty_cwd(pty_pid);
                    if let Err(e) = &current_cwd {
                        error!("Fail to get cwd for pty. {}", e);
                        app_handle.exit(1)
                    }
                    let cwd = current_cwd.unwrap();

                    if let Ok(files) = scan_directory(&cwd) {
                        let _ = app_handle.emit_all("files", files);
                    }
                }
            });

            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let status = child.wait().unwrap();
                debug!("Exit status {}", status.exit_code());
                app_handle.exit(status.exit_code() as i32)
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
