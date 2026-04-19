#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use log::{info, LevelFilter};
use sysinfo::System;
use tauri::Manager;
use tauri_plugin_log::{Target, TargetKind};

use crate::event::main::EventProcessor;
use crate::file::main::DirectoryFileWatcher;
use crate::session::main::PtySessionManager;
use crate::sys::main::SystemMonitor;

mod event;
mod file;
mod session;
mod sys;

#[tauri::command]
async fn kernel_version() -> Result<String, String> {
    System::kernel_version()
        .map(|v| v.chars().take_while(|&ch| ch != '-').collect::<String>())
        .ok_or_else(|| "Failed to get kernel version".to_string())
}

fn main() {
    let log_level = if cfg!(debug_assertions) {
        LevelFilter::Info
    } else {
        LevelFilter::Error
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
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
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = app
                .get_webview_window("main")
                .expect("no main window")
                .set_focus();
        }))
        .invoke_handler(tauri::generate_handler![kernel_version])
        .setup(move |app| {
            info!("Log Level: {:?}", log_level);

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

            // Refresh and emit system information on a dedicated OS thread.
            //
            // Why a plain `std::thread` and not `tauri::async_runtime::spawn`
            // or `spawn_blocking`? One tick of sysinfo refresh + extraction
            // inside `SystemMonitor::run` averages ~84 ms, which is two
            // orders of magnitude above Tokio's 10–100 µs guideline for work
            // that runs on async worker threads, and the loop runs for the
            // full lifetime of the app. Tokio's own docs call this case out
            // explicitly:
            //
            //     For tasks that run forever ... use `std::thread::spawn`
            //     directly.
            //     — https://docs.rs/tokio/latest/tokio/task/index.html
            //
            // `spawn_blocking` would permanently park one slot in Tokio's
            // bounded blocking-thread pool (default 512) for no benefit. A
            // plain named OS thread is cheaper, shows up clearly in
            // `top -H` / profilers, and decouples the monitor from the
            // async runtime entirely.
            //
            // The thread is fire-and-forget. It bails on its own when the
            // event channel receiver is dropped during shutdown (see
            // `SystemMonitor::run`), and the OS reaps it on process exit
            // regardless. No `JoinHandle` or shutdown signal is needed
            // because the monitor holds no external resources that require
            // explicit cleanup.
            let monitor = SystemMonitor::new(1, process_event_sender.clone());
            std::thread::Builder::new()
                .name("edex-sysmon".into())
                .spawn(move || monitor.run())
                .expect("failed to spawn system monitor thread");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running edex");
}
