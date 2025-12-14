#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

extern crate core;

use log::{error, info, LevelFilter};
use portable_pty::PtySize;
use serde_json::Value;
use std::sync::{Arc, Mutex};
use sysinfo::System;
use tauri::{async_runtime::Mutex as AsyncMutex, Manager, State};
use tauri_plugin_log::{Target, TargetKind};
use tokio::time::Instant;

use crate::event::main::EventProcessor;
use crate::file::main::DirectoryFileWatcher;
use crate::session::main::PtySessionManager;
use crate::sys::main::{IPInformation, SystemMonitor};
use tauri_plugin_http::reqwest;

mod event;
mod file;
mod session;
mod sys;

struct PtySessionManagerState(Arc<Mutex<PtySessionManager>>);

struct RequestClientState(Arc<AsyncMutex<reqwest::Client>>);

#[tauri::command]
async fn kernel_version() -> Result<String, ()> {
    let kernel_version = System::kernel_version()
        .map(|v| v.chars().take_while(|&ch| ch != '-').collect::<String>())
        .expect("Fail to get kernel version.");
    Ok(kernel_version)
}

#[tauri::command]
async fn get_ip_information(
    request_client_state: State<'_, RequestClientState>,
) -> Result<Value, ()> {
    let client = request_client_state.0.lock().await;
    let resp = client
        .get("http://ip-api.com/json/?fields=status,countryCode,region,city,query")
        .send()
        .await;

    if let Err(e) = resp {
        error!("Fail to make request. Error: {:}", &e);
        return Err(());
    }

    let data = resp.unwrap().text().await;

    if let Err(e) = data {
        error!("Fail to get response data. Error: {:}", e);
        return Err(());
    }

    let information: IPInformation = serde_json::from_str(data.unwrap().as_str()).unwrap();
    if information.is_fail() {
        return Err(());
    }

    Ok(information.to_json())
}

#[tauri::command]
async fn get_network_latency(
    request_client_state: State<'_, RequestClientState>,
) -> Result<u128, ()> {
    let client = request_client_state.0.lock().await;

    let start_time = Instant::now();
    let _ = client
        .get("https://1.1.1.1/dns-query?name=google.com")
        .header("accept", "application/dns-json")
        .send()
        .await;

    let elapsed_time = Instant::now().duration_since(start_time);

    Ok(elapsed_time.as_millis())
}

#[tauri::command]
async fn initialize_session(
    session_manager_state: State<'_, PtySessionManagerState>,
    id: u8,
) -> Result<(), ()> {
    if let Err(e) = session_manager_state.0.lock().unwrap().spawn_pty(id) {
        error!("Fail to spawn new pty session: {:?}", e);
    }
    Ok(())
}

#[tauri::command]
async fn resize_session(
    session_manager_state: State<'_, PtySessionManagerState>,
    id: u8,
    rows: u16,
    cols: u16,
) -> Result<(), ()> {
    let result = session_manager_state.0.lock().unwrap().resize(
        id,
        PtySize {
            rows,
            cols,
            ..Default::default()
        },
    );
    if let Err(e) = result {
        error!("Fail to resize pty session: {:?}", e);
    }
    Ok(())
}

#[tauri::command]
async fn write_to_session(
    session_manager_state: State<'_, PtySessionManagerState>,
    id: u8,
    data: &str,
) -> Result<(), ()> {
    let result = session_manager_state
        .0
        .lock()
        .unwrap()
        .write(id, data.as_bytes());
    if let Err(e) = result {
        error!("Fail to write to session: {:?}", e);
    }
    Ok(())
}

#[tauri::command]
async fn update_current_session(
    session_manager_state: State<'_, PtySessionManagerState>,
    id: u8,
) -> Result<(), ()> {
    let result = session_manager_state.0.lock().unwrap().switch_session(id);
    if let Err(e) = result {
        error!(
            "Fail to find pid for session with id: {}. Error: {:?}",
            id, e
        );
    }
    Ok(())
}

fn main() {
    let log_level;
    if cfg!(debug_assertions) {
        log_level = LevelFilter::Trace;
    } else {
        log_level = LevelFilter::Error;
    }

    info!("Log Level: {:?}", log_level);
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_os::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir { file_name: None }),
                ])
                .level(log_level)
                .build(),
        )
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = app
                .get_webview_window("main")
                .expect("no main window")
                .set_focus();
        }))
        .manage(RequestClientState(Arc::new(AsyncMutex::new(
            reqwest::Client::new(),
        ))))
        .invoke_handler(tauri::generate_handler![
            kernel_version,
            get_ip_information,
            get_network_latency,
            initialize_session,
            write_to_session,
            resize_session,
            update_current_session
        ])
        .setup(move |app| {
            let (mut event_processor, process_event_sender) =
                EventProcessor::new(app.handle().clone());

            // Start event processor in background
            tauri::async_runtime::spawn(async move {
                event_processor.run().await;
            });

            let (mut directory_file_watcher, directory_file_watcher_event_sender) =
                DirectoryFileWatcher::new(process_event_sender.clone());

            // Start directory file watcher processor in background
            tauri::async_runtime::spawn(async move {
                directory_file_watcher.run().await;
            });

            let pty_manager = PtySessionManager::new(
                process_event_sender.clone(),
                directory_file_watcher_event_sender.clone(),
            );
            app.manage(PtySessionManagerState(Arc::new(Mutex::new(pty_manager))));

            // refresh and emit system information
            let mut monitor = SystemMonitor::new(1, process_event_sender.clone());
            tauri::async_runtime::spawn(async move { monitor.run().await });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running edex");
}
