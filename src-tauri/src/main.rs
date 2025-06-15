#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

extern crate core;

use log::{error, info, LevelFilter};
use notify::{
    recommended_watcher, Event as NotifyEvent, RecursiveMode, Result as NotifyResult, Watcher,
};
use portable_pty::PtySize;
use serde_json::Value;
use std::sync::Arc;
use std::{path::PathBuf, sync::atomic::AtomicI32, sync::atomic::Ordering, time::Duration};
use sysinfo::System;
use tauri::{async_runtime::Mutex as AsyncMutex, Emitter, Manager, State};
use tauri_plugin_log::{Target, TargetKind};
use tokio::time::Instant;

use crate::constant::main::UPDATE_FILES;
use crate::event::main::EventProcessor;
use crate::path::main::{get_current_pty_cwd, scan_directory};
use crate::session::main::PtySessionManager;
use crate::sys::main::{IPInformation, SystemMonitor};
use tauri_plugin_http::reqwest;
use tokio::sync::Mutex;

mod constant;
mod event;
mod path;
mod session;
mod sys;

struct PtySessionManagerState(Arc<Mutex<PtySessionManager>>);

struct CurrentProcessState(Arc<AtomicI32>);

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
    current_process_state: State<'_, CurrentProcessState>,
    id: u8,
) -> Result<(), ()> {
    let result = session_manager_state.0.lock().await.spawn_pty(id);
    match result {
        Ok(pid) => current_process_state.0.store(pid, Ordering::Relaxed),
        Err(e) => error!("Fail to spawn new pty session: {:?}", e),
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
    let result = session_manager_state.0.lock().await.resize(
        id,
        PtySize {
            rows,
            cols,
            ..Default::default()
        },
    );
    match result {
        Ok(()) => {}
        Err(e) => error!("Fail to resize pty session: {:?}", e),
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
        .await
        .write(id, data.as_bytes());
    match result {
        Ok(()) => {}
        Err(e) => error!("Fail to write to session: {:?}", e),
    }
    Ok(())
}

#[tauri::command]
async fn update_current_session(
    session_manager_state: State<'_, PtySessionManagerState>,
    current_process_state: State<'_, CurrentProcessState>,
    id: u8,
) -> Result<(), ()> {
    let result = session_manager_state.0.lock().await.get_pid(id);
    match result {
        Ok(pid) => current_process_state.0.store(pid, Ordering::Relaxed),
        Err(e) => error!(
            "Fail to find pid for session with id: {}. Error: {:?}",
            id, e
        ),
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
        .manage(CurrentProcessState(Arc::new(AtomicI32::default())))
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
            let (mut event_processor, event_tx) = EventProcessor::new(app.handle().clone());

            // Start event processor in background
            tauri::async_runtime::spawn(async move {
                event_processor.run().await;
            });

            let pty_manager = PtySessionManager::new(event_tx.clone());
            app.manage(PtySessionManagerState(Arc::new(Mutex::new(pty_manager))));

            // refresh and emit system information
            let mut monitor = SystemMonitor::new(1, event_tx.clone());
            tauri::async_runtime::spawn(async move {
                if let Err(e) = monitor.start_monitoring().await {
                    error!("Fail to start system monitoring. Error: {}", e);
                }
            });

            let file_watcher = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let watcher_handle = file_watcher.clone();
                let mut watcher =
                    recommended_watcher(move |res: NotifyResult<NotifyEvent>| match res {
                        Ok(event) => {
                            if event.kind.is_create()
                                || event.kind.is_modify()
                                || event.kind.is_remove()
                            {
                                let path = event.paths[0].parent().unwrap().to_path_buf();
                                if let Ok(files) = scan_directory(&path) {
                                    watcher_handle.emit(UPDATE_FILES, files).unwrap();
                                }
                            }
                        }
                        Err(e) => error!("watch error: {:?}", e),
                    })
                        .unwrap();

                let mut prev_cwd = PathBuf::default();
                let mut interval = tokio::time::interval(Duration::from_millis(500));
                let current_process_state: State<CurrentProcessState> =
                    file_watcher.state::<CurrentProcessState>();
                loop {
                    interval.tick().await;
                    let pid = current_process_state.0.load(Ordering::Relaxed);
                    if 0 == pid {
                        continue;
                    }

                    // Get current pty cwd
                    let current_cwd = get_current_pty_cwd(&pid);
                    if let Err(e) = &current_cwd {
                        error!("Fail to get cwd for pid {}. {}", &pid, e);
                        // since this thread is running in parallel with terminal thread, and we rely on share states between threads
                        // there is possible race condition that we get the pid in current cycle while at the meantime, the terminal is closed in other thread
                        // in this case, the current pid in this cycle will not have cwd.
                        // Will ignore this race condition for now until have better way to handle it.
                        continue;
                    }
                    let cwd = current_cwd.unwrap();

                    if cwd != prev_cwd || prev_cwd.as_os_str().is_empty() {
                        if !prev_cwd.as_os_str().is_empty() {
                            watcher.unwatch(&prev_cwd).unwrap();
                        }
                        watcher.watch(&cwd, RecursiveMode::NonRecursive).unwrap();
                        prev_cwd = cwd.clone();
                        if let Ok(files) = scan_directory(&cwd) {
                            file_watcher.emit(UPDATE_FILES, files).unwrap();
                        }
                    }
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running edex");
}
