use crate::event::main::ProcessEvent;
use crate::file::main::{DirectoryWatcherEvent, WatcherPayload};
use dashmap::DashMap;
use log::{error, warn};
use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use serde::{Deserialize, Serialize};
use std::io::{Read, Write};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::{AppHandle, Listener};
use tokio::sync::mpsc;

/// Monotonic counter used to tag each PTY session's reader and waiter threads
/// with a short, unique index. Linux caps thread names at 15 bytes, so we use
/// a compact numeric suffix (e.g. `edex-ptyR-7`) rather than the full UUID.
static SESSION_THREAD_COUNTER: AtomicU64 = AtomicU64::new(0);

/// Build the shell `CommandBuilder` used for every PTY session.
///
/// We use `CommandBuilder::new_default_prog()` on both macOS and Linux.
/// Portable-pty resolves `$SHELL` (with a passwd-DB fallback) and invokes it
/// as a login shell by prefixing `argv[0]` with `-` — the canonical Unix
/// mechanism, the same one `login(1)` and `sshd` use.
///
/// On macOS this is required: GUI apps inherit launchd's minimal environment
/// and only login shells source `~/.zprofile` / `~/.bash_profile` where
/// users set `PATH` (Homebrew, etc.).
///
/// On Linux, bash's login mode technically skips `~/.bashrc`, but this is
/// both (a) the convention every other standalone terminal follows and
/// (b) easy for users to work around in their dotfiles. When we add a
/// settings surface (via `tauri-plugin-store`), this can become a
/// user-configurable toggle.
///
/// `portable_pty::CommandBuilder` already copies the full parent env (see
/// `get_base_env` in portable-pty's `cmdbuilder.rs`), so we don't forward
/// individual vars. We only:
///   1. strip Tauri / WebKit / GTK internals and dangerous vars that would
///      leak into the child shell (same approach as VSCode's
///      `sanitizeProcessEnvironment` + `removeDangerousEnvVariables`),
///   2. set terminal-identity vars last so they override anything inherited.
fn construct_cmd() -> CommandBuilder {
    #[cfg(target_os = "macos")]
    let mut cmd = CommandBuilder::new("zsh");
    #[cfg(target_os = "linux")]
    let mut cmd = CommandBuilder::new("bash");
    #[cfg(target_os = "windows")]
    let mut cmd = CommandBuilder::new("powershell.exe");

    #[cfg(target_os = "windows")]
    {
        cmd.args(["-NoLogo", "-NoExit", "-NoProfile"]);
        if let Ok(home) = std::env::var("USERPROFILE") {
            cmd.cwd(std::path::Path::new(&home));
        }
    }

    #[cfg(not(target_os = "windows"))]
    cmd.args(["-l"]);

    cmd.env("TERM", "xterm-256color");
    cmd.env("COLORTERM", "truecolor");
    cmd.env("TERM_PROGRAM", "eDEX-UI");
    cmd.env("TERM_PROGRAM_VERSION", "1.0.0");

    #[cfg(target_os = "windows")]
    for var in [
        "USERPROFILE",
        "USERNAME",
        "USERDOMAIN",
        "PATH",
        "SYSTEMROOT",
        "TEMP",
        "TMP",
    ] {
        if let Ok(val) = std::env::var(var) {
            cmd.env(var, val);
        }
    }

    #[cfg(not(target_os = "windows"))]
    for var in ["HOME", "USER", "SHELL", "PATH", "LANG"] {
        if let Ok(val) = std::env::var(var) {
            cmd.env(var, val);
        }
    }

    cmd
}

fn should_strip_env(key: &str) -> bool {
    const PREFIXES: &[&str] = &[
        "TAURI_",
        "WEBKIT_",
        "GTK_",
        "APPIMAGE",
        "APPDIR",
        "GDK_PIXBUF_",
        "SNAP",
    ];
    const EXACT: &[&str] = &[
        "DEBUG",
        #[cfg(target_os = "linux")]
        "LD_PRELOAD",
    ];
    PREFIXES.iter().any(|p| key.starts_with(p)) || EXACT.contains(&key)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
enum PtySessionCommand {
    Write { data: String },
    Resize { cols: u16, rows: u16 },
    Exit,
}

struct PtySession {
    pid: i32,
}

impl PtySession {
    pub fn new<F>(
        id: &str,
        process_event_sender: mpsc::UnboundedSender<ProcessEvent>,
        app_handle: AppHandle,
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

        let pid = child.process_id().unwrap_or(0) as i32;

        // Get reader and writer from master
        let mut reader = master.try_clone_reader()?;
        let writer = master.take_writer()?;

        // Clone sender for the reader task
        let pty_reader_sender = process_event_sender.clone();
        let id_for_reader = id.to_owned();

        // Spawn reader on a dedicated OS thread rather than
        // `tauri::async_runtime::spawn_blocking`. Per Tokio's guidance, tasks
        // that run forever should use `std::thread::spawn` directly — this
        // keeps a slot permanently out of the blocking pool and gives the
        // thread a descriptive name (visible in `top -H`, `perf`, etc.)
        // instead of blending into the anonymous `tokio-rt-worker` pool.
        //
        // Buffer sizing: the kernel PTY line discipline caps each `read()`
        // at ~4 KiB on Linux and less on macOS, so any buffer ≥ 8 KiB is
        // sufficient. 64 KiB gives headroom for any platform where the
        // limit might be larger without meaningful cost — Linux lazily
        // backs the pages so untouched bytes never hit physical RAM.
        let thread_idx = SESSION_THREAD_COUNTER.fetch_add(1, Ordering::Relaxed);
        thread::Builder::new()
            .name(format!("edex-ptyR-{thread_idx}"))
            .spawn(move || {
                let mut buf = vec![0u8; 64 * 1024];
                loop {
                    match reader.read(&mut buf) {
                        Ok(0) => break, // EOF
                        Ok(n) => {
                            if let Err(e) = pty_reader_sender.send(ProcessEvent::Forward {
                                id: id_for_reader.clone(),
                                data: buf[..n].to_vec(),
                            }) {
                                error!("Fail to send output. {:?}", e);
                                break;
                            }
                        }
                        Err(e) => {
                            error!(
                                "Error when reading from pty for session {}: Error: {}",
                                id_for_reader, e
                            );
                            break;
                        }
                    }
                }
            })
            .expect("failed to spawn pty reader thread");

        let writer = Mutex::new(writer);
        let master = Mutex::new(master);
        let killer = Mutex::new(child.clone_killer());
        let event_id = app_handle.listen(id, move |event| {
            match serde_json::from_str::<PtySessionCommand>(event.payload()) {
                Ok(PtySessionCommand::Write { data }) => {
                    let mut w = writer.lock().unwrap(); // Clone avoided
                    if let Err(e) = w.write_all(data.as_bytes()) {
                        error!("Failed to write to session: {:?}", e);
                    }
                }
                Ok(PtySessionCommand::Resize { cols, rows }) => {
                    let size = PtySize {
                        rows,
                        cols,
                        ..Default::default()
                    };
                    let m = master.lock().unwrap(); // Clone avoided
                    if let Err(e) = m.resize(size) {
                        error!("Failed to resize session: {:?}", e);
                    }
                }
                Ok(PtySessionCommand::Exit) => {
                    if let Err(e) = killer.lock().unwrap().kill() {
                        error!("Failed to kill session: {:?}", e);
                    }
                }
                Err(e) => {
                    error!("Failed to parse command: {:?}", e);
                }
            }
        });

        let id_for_exit = id.to_owned();
        let app_handle_for_cleanup = app_handle;
        let child_watcher_sender = process_event_sender.clone();
        // Spawn the child waiter on a dedicated OS thread; same reasoning as
        // the reader above. `child.wait()` blocks until the shell exits,
        // which is unbounded in duration, so it belongs outside the Tokio
        // blocking pool.
        //
        // Note: there is no reader handle to abort here — the reader thread
        // terminates naturally when the PTY's slave side is closed during
        // child exit, which causes `read()` to return `Ok(0)` (Linux) or
        // `Err(EIO)` (macOS) and the loop to break.
        thread::Builder::new()
            .name(format!("edex-ptyW-{thread_idx}"))
            .spawn(move || {
                let exit_code = match child.wait() {
                    Ok(status) => Some(status.exit_code()),
                    Err(e) => {
                        error!("Failed to wait for child process: {:?}", e);
                        None
                    }
                };
                app_handle_for_cleanup.unlisten(event_id);
                if let Err(e) = child_watcher_sender.send(ProcessEvent::ProcessExit {
                    id: id_for_exit,
                    exit_code,
                }) {
                    error!("Fail to send process exit event. {:?}", e);
                }
                cleanup();
            })
            .expect("failed to spawn pty waiter thread");

        Ok(Self { pid })
    }

    pub fn pid(&self) -> i32 {
        self.pid
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type", content = "payload")]
enum PtySessionManagerCommand {
    Initialize { id: String },
    Switch { id: String },
}

pub struct PtySessionManager {
    process_event_sender: mpsc::UnboundedSender<ProcessEvent>,
    directory_file_watcher_event_sender: mpsc::UnboundedSender<DirectoryWatcherEvent>,
    active_sessions: Arc<DashMap<String, PtySession>>,
}

impl PtySessionManager {
    pub fn new(
        process_event_sender: mpsc::UnboundedSender<ProcessEvent>,
        directory_file_watcher_event_sender: mpsc::UnboundedSender<DirectoryWatcherEvent>,
    ) -> Self {
        Self {
            process_event_sender,
            directory_file_watcher_event_sender,
            active_sessions: Arc::new(DashMap::new()),
        }
    }

    pub fn start(&mut self, app_handle: AppHandle) {
        let active_sessions = self.active_sessions.clone();
        let process_event_sender = self.process_event_sender.clone();
        let directory_file_watcher_sender = self.directory_file_watcher_event_sender.clone();
        let app_handle_clone = app_handle.clone();

        app_handle.listen("manager", move |event| {
            match serde_json::from_str::<PtySessionManagerCommand>(event.payload()) {
                Ok(PtySessionManagerCommand::Initialize { id }) => {
                    Self::spawn_pty(
                        &id,
                        &active_sessions,
                        &process_event_sender,
                        &directory_file_watcher_sender,
                        &app_handle_clone,
                    );
                }
                Ok(PtySessionManagerCommand::Switch { id }) => {
                    Self::switch_session(&id, &active_sessions, &directory_file_watcher_sender);
                }
                Err(e) => {
                    error!("Failed to parse command for session manager: {:?}", e);
                }
            }
        });
    }

    fn spawn_pty(
        id: &str,
        active_sessions: &Arc<DashMap<String, PtySession>>,
        process_event_sender: &mpsc::UnboundedSender<ProcessEvent>,
        directory_file_watcher_sender: &mpsc::UnboundedSender<DirectoryWatcherEvent>,
        app_handle: &AppHandle,
    ) {
        let active_sessions_inner = active_sessions.clone();
        let directory_watcher_inner = directory_file_watcher_sender.clone();
        let id_for_cleanup = id.to_owned();
        let app_handle_for_cleanup = app_handle.clone();

        let pty_session_result = PtySession::new(
            id,
            process_event_sender.clone(),
            app_handle.clone(),
            move || {
                if let Err(e) =
                    directory_watcher_inner.send(DirectoryWatcherEvent::Watch { initial: None })
                {
                    error!(
                        "Fail to send directory update event on session close. {:?}",
                        e
                    )
                }
                active_sessions_inner.remove(&id_for_cleanup);

                // user closed all sessions, we should exit the app now.
                if active_sessions_inner.is_empty() {
                    app_handle_for_cleanup.exit(0i32);
                }
            },
        );

        match pty_session_result {
            Ok(pty_session) => {
                if active_sessions.contains_key(id) {
                    warn!("Session {} already exists, overwriting", id);
                }
                let pid = pty_session.pid();
                active_sessions.insert(id.to_owned(), pty_session);

                if let Err(e) = directory_file_watcher_sender.send(DirectoryWatcherEvent::Watch {
                    initial: Some(WatcherPayload::new(pid)),
                }) {
                    error!("Fail to send directory update event. {:?}", e);
                }
            }
            Err(e) => {
                error!("Failed to initialize new session {}: {:?}", id, e);
            }
        }
    }

    fn switch_session(
        id: &str,
        active_sessions: &Arc<DashMap<String, PtySession>>,
        directory_file_watcher_sender: &mpsc::UnboundedSender<DirectoryWatcherEvent>,
    ) {
        match active_sessions.get(id) {
            Some(pty_session) => {
                if let Err(e) = directory_file_watcher_sender.send(DirectoryWatcherEvent::Watch {
                    initial: Some(WatcherPayload::new(pty_session.pid())),
                }) {
                    error!("Fail to send directory update event. {:?}", e);
                }
            }
            None => {
                error!("Session {} not found on switching", id);
            }
        }
    }
}
