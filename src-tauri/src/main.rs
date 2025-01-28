#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

extern crate core;

use std::{
    io::{BufRead, BufReader, Read, Write},
    path::PathBuf,
    sync::atomic::AtomicI32,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
    time::Duration,
};

use log::{error, info, trace, LevelFilter};
use notify::{
    recommended_watcher, Event as NotifyEvent, RecursiveMode, Result as NotifyResult, Watcher,
};
use portable_pty::{native_pty_system, PtySize};
use serde_json::{json, Value};
use sysinfo::{CpuRefreshKind, ProcessRefreshKind, RefreshKind, System, SystemExt};
use tauri::{
    async_runtime::Mutex as AsyncMutex, AppHandle, Emitter, Listener, Manager, Runtime, State,
};
use tauri_plugin_log::{Target, TargetKind};
use tokio::time::Instant;

use crate::constant::main::{
    reader_event_key, resize_event_key, writer_event_key, DESTROY_TERMINAL, UPDATE_FILES,
};
use crate::path::main::{get_current_pty_cwd, scan_directory};
use crate::session::main::{construct_cmd, ResizePayload};
use crate::sys::main::{
    extract_cpu_data, extract_disk_usage, extract_memory, extract_network, extract_process,
    extract_temperature, IPInformation,
};
use tauri_plugin_http::reqwest;

mod constant;
mod path;
mod session;
mod sys;

struct CurrentProcessState(Arc<AtomicI32>);

struct RequestClientState(Arc<AsyncMutex<reqwest::Client>>);

#[tauri::command]
async fn kernel_version() -> Result<String, ()> {
    let sys = System::new_with_specifics(RefreshKind::new());
    let kernel_version = sys
        .kernel_version()
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
async fn new_terminal_session<R: Runtime>(
    app_handle: AppHandle<R>,
    current_process_state: State<'_, CurrentProcessState>,
    id: u8,
) -> Result<i32, ()> {
    let pty_system = native_pty_system();

    let pty_pair = pty_system
        .openpty(PtySize {
            rows: 24,
            cols: 80,
            pixel_width: 0,
            pixel_height: 0,
        })
        .unwrap();

    let cmd = construct_cmd();
    let mut child = pty_pair.slave.spawn_command(cmd).unwrap();

    // Release any handles owned by the slave: we don't need it now
    // that we've spawned the child.
    drop(pty_pair.slave);

    // Save these somewhere you can access them back if you need to close the streams
    let pty_reader = pty_pair.master.try_clone_reader().unwrap();
    let reader = Arc::new(AsyncMutex::new(Some(BufReader::new(pty_reader))));
    let should_stop_reader = Arc::new(AtomicBool::new(false));

    let pty_writer = Arc::new(Mutex::new(pty_pair.master.take_writer().unwrap()));
    let master = Arc::new(Mutex::new(pty_pair.master));

    let pid = &master
        .lock()
        .unwrap()
        .process_group_leader()
        .expect("Fail to get pid.");

    // create listener to lister frontend terminal inputs
    let writer_listener = app_handle.listen(writer_event_key(&id), move |event| {
        let payload: String = serde_json::from_str(&event.payload()).unwrap();
        let _ = pty_writer
            .lock()
            .unwrap()
            .write(payload.as_bytes())
            .map_err(|e| error!("Error on write to pty. Error: {:?}", e));
    });

    // create listener to lister frontend terminal resize action
    let resize_listener = app_handle.listen(resize_event_key(&id), move |event| {
        let payload: ResizePayload = serde_json::from_str(event.payload()).unwrap();
        let _ = master
            .lock()
            .unwrap()
            .resize(PtySize {
                rows: payload.rows(),
                cols: payload.cols(),
                ..Default::default()
            })
            .map_err(|e| error!("Error on resize pty. Error: {:?}", e));
    });

    // create new thread to handle terminal read, write and resize
    let terminal_process = app_handle.clone();
    let should_stop_reader_signal = should_stop_reader.clone();
    tauri::async_runtime::spawn(async move {
        listen_terminal(&id, reader, &terminal_process, should_stop_reader_signal).await;

        // cleanup
        trace!("Terminal {} is closed. Proceed to cleanup listeners.", &id);
        terminal_process.unlisten(resize_listener);
        terminal_process.unlisten(writer_listener);
    });

    // new thread to listen to terminal exit signal
    let child_process_handle = app_handle.clone();
    tauri::async_runtime::spawn(async move {
        let status = child.wait().unwrap();
        let exit_code = status.exit_code();
        should_stop_reader.store(true, Ordering::Relaxed);
        handle_terminal_close(&id, exit_code, child_process_handle).await
    });

    trace!("Create new terminal: {}", pid);
    current_process_state
        .0
        .store(pid.clone(), Ordering::Relaxed);
    Ok(*pid)
}

async fn listen_terminal<R: Runtime>(
    id: &u8,
    reader: Arc<AsyncMutex<Option<BufReader<Box<dyn Read + Send>>>>>,
    app_handle: &AppHandle<R>,
    should_stop: Arc<AtomicBool>,
) {
    let event_key = reader_event_key(id);
    let reader = reader.lock().await.take();
    let mut interval = tokio::time::interval(Duration::from_millis(1));
    if let Some(mut reader) = reader {
        loop {
            if should_stop.load(Ordering::Relaxed) {
                break;
            }
            interval.tick().await;
            let data = reader.fill_buf().unwrap().to_vec();
            reader.consume(data.len());
            if data.len() > 0 {
                app_handle.emit(&event_key, data).unwrap();
            }
        }
    }
}

async fn handle_terminal_close<R: Runtime>(id: &u8, exit_code: u32, app_handle: AppHandle<R>) {
    trace!("Exit status {}. Id: {}", &exit_code, &id);

    // exit the application if exit on the main terminal
    if &0u8 == id {
        app_handle.exit(exit_code as i32);
        return;
    }

    // remove the terminal
    trace!("Destroy terminal {}.", &id);
    app_handle.emit(DESTROY_TERMINAL, &id).unwrap();
}

#[tauri::command]
async fn update_current_pid(
    current_process_state: State<'_, CurrentProcessState>,
    pid: i32,
) -> Result<(), ()> {
    current_process_state.0.store(pid, Ordering::Relaxed);
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
            new_terminal_session,
            update_current_pid
        ])
        .setup(move |app| {
            // updating and emitting system information
            let system_info_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let mut sys = System::new_with_specifics(
                    RefreshKind::new()
                        .with_memory()
                        .with_cpu(CpuRefreshKind::everything().without_frequency())
                        .with_processes(
                            ProcessRefreshKind::everything()
                                .without_disk_usage()
                                .without_user(),
                        )
                        .with_components_list()
                        .with_networks_list()
                        .with_disks_list(),
                );

                let mut interval = tokio::time::interval(Duration::from_secs(1));
                loop {
                    interval.tick().await;
                    sys.refresh_all();

                    // Emit information
                    let _ = system_info_handle.emit("uptime", &sys.uptime());
                    let _ = system_info_handle.emit("memory", extract_memory(&sys));
                    let _ = system_info_handle.emit("load", extract_cpu_data(&sys));
                    let _ = system_info_handle.emit("network", extract_network(&sys));
                    let _ = system_info_handle.emit("disk", extract_disk_usage(&sys));
                    let _ =
                        system_info_handle.emit("temperature", json!(extract_temperature(&sys)));

                    let processes = extract_process(&sys);
                    let _ = system_info_handle.emit("process", json!(&processes));
                    let _ = system_info_handle.emit(
                        "process_short",
                        json!(processes.iter().take(10).cloned().collect::<Vec<_>>()),
                    );
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
