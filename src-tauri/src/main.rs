#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

extern crate core;

use std::{
    collections::HashMap,
    io::{
        BufRead,
        BufReader,
        Read,
        Write,
    },
    sync::{
        Arc,
        atomic::{AtomicBool, Ordering},
        Mutex,
    },
    time::Duration,
};

use log::{error, info, LevelFilter, trace};
use portable_pty::{native_pty_system, PtySize};
use serde_json::{
    json,
    Value,
};
use sysinfo::{CpuRefreshKind, ProcessRefreshKind, RefreshKind, System, SystemExt};
use tauri::{AppHandle, async_runtime::Mutex as AsyncMutex, Manager, Runtime, State};
use tauri_plugin_log::LogTarget;
use tokio::time::Instant;

use crate::path::main::{get_current_pty_cwd, scan_directory};
use crate::session::main::{construct_cmd, ResizePayload};
use crate::sys::main::{extract_cpu_data, extract_disk_usage, extract_memory, extract_network, extract_process, IPInformation};

mod sys;
mod path;
mod session;

#[derive(Clone, serde::Serialize)]
struct Payload {
    args: Vec<String>,
    cwd: String,
}

struct RequestClientState(Arc<AsyncMutex<reqwest::Client>>);

struct TerminalSessionState(Arc<AsyncMutex<HashMap<u8, i32>>>);

struct TerminalIndex(Arc<AsyncMutex<u8>>);

#[tauri::command]
async fn kernel_version() -> Result<String, ()> {
    let sys = System::new_with_specifics(RefreshKind::new());
    let kernel_version = sys.kernel_version()
        .map(|v| v.chars().take_while(|&ch| ch != '-').collect::<String>())
        .expect("Fail to get kernel version.");
    Ok(kernel_version)
}

#[tauri::command]
async fn get_ip_information(request_client_state: State<'_, RequestClientState>) -> Result<Value, ()> {
    let client = request_client_state.0.lock().await;
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
    let client = request_client_state.0.lock().await;

    let start_time = Instant::now();
    let _ = client.get("https://1.1.1.1/dns-query?name=google.com")
        .header("accept", "application/dns-json")
        .send()
        .await;

    let elapsed_time = Instant::now().duration_since(start_time);

    Ok(elapsed_time.as_millis())
}

#[tauri::command]
async fn new_terminal_session<R: Runtime>(app_handle: AppHandle<R>,
                                          terminal_index_state: State<'_, TerminalIndex>,
                                          terminal_session_state: State<'_, TerminalSessionState>,
                                          id: u8) -> Result<(), ()> {
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

    let pid = &master.lock().unwrap().process_group_leader().expect("Fail to get pid.");
    trace!("Create new terminal: {}", pid);
    terminal_session_state.0.lock().await.insert(id, *pid);

    // create new thread to handle terminal read, write and resize\
    let terminal_process = app_handle.clone();
    let should_stop_reader_signal = should_stop_reader.clone();
    tauri::async_runtime::spawn(async move {
        // create listener to lister frontend terminal inputs
        let writer_event_key = format!("writer-{}", &id);
        let writer_listener = &terminal_process.listen_global(writer_event_key, move |event| {
            let payload: String = serde_json::from_str(&event.payload().unwrap()).unwrap();
            _ = pty_writer.lock().unwrap().write(payload.as_bytes())
                .map_err(|e| error!("Error on write to pty. Error: {:?}", e))
        });

        // create listener to lister frontend terminal resize action
        let resize_event_key = format!("resize-{}", &id);
        let resize_listener = &terminal_process.listen_global(resize_event_key, move |event| {
            let payload: ResizePayload = event.payload().map(|v| serde_json::from_str(v).unwrap()).unwrap();
            _ = master.lock()
                .unwrap()
                .resize(PtySize {
                    rows: payload.rows(),
                    cols: payload.cols(),
                    ..Default::default()
                })
                .map_err(|e| error!("Error on resize pty. Error: {:?}", e))
        });

        listen_terminal(&id, reader, &terminal_process, should_stop_reader_signal).await;

        // cleanup
        trace!("Terminal {} is closed. Proceed to cleanup listeners.", &id);
        terminal_process.unlisten(*resize_listener);
        terminal_process.unlisten(*writer_listener);
    });

    let child_process_handle = app_handle.clone();
    tauri::async_runtime::spawn(async move {
        let status = child.wait().unwrap();
        let exit_code = status.exit_code();
        should_stop_reader.store(true, Ordering::Relaxed);
        handle_terminal_close(&id, exit_code, child_process_handle).await
    });

    // set the current index to the newly created terminal
    update_current_terminal(id, terminal_index_state).await.expect("Fail to set index to newly created terminal");
    Ok(())
}

pub async fn listen_terminal<R: Runtime>(id: &u8,
                                         reader: Arc<AsyncMutex<Option<BufReader<Box<dyn Read + Send>>>>>,
                                         app_handle: &AppHandle<R>,
                                         should_stop: Arc<AtomicBool>) {
    let event_key = format!("data-{}", id);
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
                app_handle.emit_all(&event_key, data).unwrap();
            }
        }
    }
}

pub async fn handle_terminal_close<R: Runtime>(id: &u8,
                                               exit_code: u32,
                                               app_handle: AppHandle<R>) {
    trace!("Exit status {}. Id: {}", &exit_code, &id);
    let terminal_index_state: State<TerminalIndex> = app_handle.state::<TerminalIndex>();

    let terminal_state: State<TerminalSessionState> = app_handle.state::<TerminalSessionState>();
    let mut terminal_sessions = terminal_state.0.lock().await;

    // exit the application if there is only one terminal left
    // or exit on the main terminal
    if terminal_sessions.len() == 1 || &0 == id {
        app_handle.exit(exit_code as i32);
        return;
    }
    // find the next terminal index
    let mut ids = terminal_sessions.iter()
        .map(|t| t.0)
        .collect::<Vec<&u8>>();
    ids.sort();
    let current_index = ids.iter().position(|&r| r == id).unwrap();

    let new_index;
    if current_index == ids.len() - 1 {
        new_index = ids[current_index - 1];
    } else {
        new_index = ids[current_index + 1];
    }

    // remove the terminal and update the index
    let payload = json!({
                "deleted": &id,
                "newIndex": &new_index
            });
    trace!("Destroy terminal {}. New Active Terminal Id: {}", &id, &new_index);
    update_current_terminal(*new_index, terminal_index_state).await.expect("Fail to set index to newly created terminal");
    terminal_sessions.remove(&id);
    app_handle.emit_all("destroy", payload).unwrap();
}

#[tauri::command]
async fn update_current_terminal(id: u8,
                                 terminal_index_state: State<'_, TerminalIndex>) -> Result<(), ()> {
    let mut current_terminal_index = terminal_index_state.0.lock().await;
    *current_terminal_index = id;
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
        .plugin(tauri_plugin_log::Builder::default()
            .targets([LogTarget::LogDir, LogTarget::Stdout])
            .level(log_level)
            .build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            info!("{}, {argv:?}, {cwd}", app.package_info().name);
            app.emit_all("single-instance", Payload { args: argv, cwd }).unwrap();
        }))
        .manage(RequestClientState(Arc::new(AsyncMutex::new(reqwest::Client::new()))))
        .manage(TerminalSessionState(Arc::new(AsyncMutex::new(HashMap::new()))))
        .manage(TerminalIndex(Arc::new(AsyncMutex::new(0))))
        .invoke_handler(tauri::generate_handler![
            kernel_version,
            get_ip_information,
            get_network_latency,
            new_terminal_session,
            update_current_terminal,
        ])
        .setup(move |app| {
            // updating and emitting system information
            let system_info_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let mut sys = System::new_with_specifics(RefreshKind::new()
                    .with_memory()
                    .with_cpu(CpuRefreshKind::everything().without_frequency())
                    .with_processes(ProcessRefreshKind::everything().without_disk_usage().without_user())
                    .with_components_list()
                    .with_networks_list()
                    .with_disks_list());

                let mut interval = tokio::time::interval(Duration::from_secs(1));
                loop {
                    interval.tick().await;
                    sys.refresh_all();

                    // Emit information
                    let _ = system_info_handle.emit_all("uptime", &sys.uptime());
                    let _ = system_info_handle.emit_all("memory", extract_memory(&sys));
                    let _ = system_info_handle.emit_all("load", extract_cpu_data(&sys));
                    let _ = system_info_handle.emit_all("network", extract_network(&sys));
                    let _ = system_info_handle.emit_all("disk", extract_disk_usage(&sys));

                    let processes = extract_process(&sys);
                    let _ = system_info_handle.emit_all("process", json!(&processes));
                    let _ = system_info_handle.emit_all("process_short", json!(processes.iter().take(10).cloned().collect::<Vec<_>>()));
                }
            });

            let file_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let mut interval = tokio::time::interval(Duration::from_secs(1));
                loop {
                    interval.tick().await;
                    let terminal_index_state: State<TerminalIndex> = file_handle.state::<TerminalIndex>();
                    let terminal_state: State<TerminalSessionState> = file_handle.state::<TerminalSessionState>();

                    let terminal_index = terminal_index_state.0.lock().await;
                    let terminal_sessions = terminal_state.0.lock().await;

                    // skip when terminal is not initialized
                    if terminal_sessions.is_empty() {
                        continue;
                    }

                    let pty_pid = terminal_sessions.get(&terminal_index)
                        .expect("Fail to get terminal session for scanning directory.");

                    // Get current pty cwd
                    let current_cwd = get_current_pty_cwd(pty_pid);
                    if let Err(e) = &current_cwd {
                        error!("Fail to get cwd for pty. {}", e);
                        file_handle.exit(1)
                    }
                    let cwd = current_cwd.unwrap();

                    if let Ok(files) = scan_directory(&cwd) {
                        let _ = file_handle.emit_all("files", files);
                    }
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
