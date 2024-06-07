use std::io::Write;

use portable_pty::{CommandBuilder, PtyPair};

pub struct TerminalSession {
    pub(crate) pid: i32,
    pub(crate) pty_pair: PtyPair,
    pub(crate) writer: Box<dyn Write + Send>,
}

pub fn construct_cmd() -> CommandBuilder {
    #[cfg(target_os = "macos")]
        let mut cmd = CommandBuilder::new("zsh");
    #[cfg(target_os = "linux")]
        let mut cmd = CommandBuilder::new("bash");

    cmd.env("TERM", "xterm-256color");
    cmd.env("COLORTERM", "truecolor");
    cmd.env("TERM_PROGRAM", "eDEX-UI");
    cmd.env("TERM_PROGRAM_VERSION", "1.0.0");

    return cmd;
}
