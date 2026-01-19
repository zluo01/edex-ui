#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

extern crate core;

use log::{info, LevelFilter};
use sysinfo::System;
use tauri::{Manager, State};
use tauri_plugin_log::{Target, TargetKind};
use tokio::time::Instant;

use crate::event::main::EventProcessor;
use crate::file::main::DirectoryFileWatcher;
use crate::session::main::PtySessionManager;
use crate::sys::main::SystemMonitor;
use tauri_plugin_http::reqwest;

mod event;
mod file;
mod session;
mod sys;

struct RequestClientState(reqwest::Client);

#[tauri::command]
async fn kernel_version() -> Result<String, ()> {
    let kernel_version = System::kernel_version()
        .map(|v| v.chars().take_while(|&ch| ch != '-').collect::<String>())
        .expect("Fail to get kernel version.");
    Ok(kernel_version)
}

#[tauri::command]
async fn get_network_latency(
    request_client_state: State<'_, RequestClientState>,
) -> Result<u128, ()> {
    let start_time = Instant::now();
    let _ = request_client_state
        .0
        .get("https://1.1.1.1/dns-query?name=google.com")
        .header("accept", "application/dns-json")
        .send()
        .await;

    let elapsed_time = Instant::now().duration_since(start_time);

    Ok(elapsed_time.as_millis())
}

fn main() {
    let log_level;
    if cfg!(debug_assertions) {
        log_level = LevelFilter::Info;
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
        .manage(RequestClientState(reqwest::Client::new()))
        .invoke_handler(tauri::generate_handler![
            kernel_version,
            get_network_latency
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

            let mut pty_manager = PtySessionManager::new(
                process_event_sender.clone(),
                directory_file_watcher_event_sender.clone(),
            );
            pty_manager.start(app.handle().clone());

            // refresh and emit system information
            let mut monitor = SystemMonitor::new(1, process_event_sender.clone());
            tauri::async_runtime::spawn(async move { monitor.run().await });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running edex");
}
