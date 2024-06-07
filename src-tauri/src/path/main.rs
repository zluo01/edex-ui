use std::{
    cmp::Ordering,
    fs,
    path::PathBuf,
    process::Command,
    str,
};

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

// Borrow from https://github.com/hharnisc/hypercwd/blob/master/setCwd.js
pub fn get_current_pty_cwd(pid: i32) -> Result<PathBuf, String> {
    let pid_str = pid.to_string();
    let response = Command::new("lsof")
        .args(&["-a", "-p", &pid_str, "-d", "cwd", "-Fn"])
        .output();

    if let Err(e) = response {
        return Err(format!("Fail to run command. Error: {}", e));
    }

    let output = response.unwrap();
    if output.status.success() {
        let lines = str::from_utf8(&output.stdout).expect("Invalid UTF-8");
        let cwd = lines.lines().last().unwrap().get(1..).unwrap();
        Ok(PathBuf::from(cwd))
    } else {
        Err(format!("Command failed with error: {:?}", output.status))
    }
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
pub enum FileType {
    Directory,
    File,
    SystemLink,
}

#[derive(Debug, Serialize, Deserialize)]
struct FileInfo {
    name: String,
    t: FileType,
    path: String,
    hidden: bool,
}

impl Ord for FileInfo {
    fn cmp(&self, other: &Self) -> Ordering {
        match (&self.t, &other.t) {
            (FileType::Directory, FileType::Directory) => {
                // Sort hidden directories first by comparing the hidden flag
                if self.hidden && !other.hidden {
                    Ordering::Less
                } else if !self.hidden && other.hidden {
                    Ordering::Greater
                } else {
                    self.name.cmp(&other.name)
                }
            }
            (FileType::Directory, FileType::File) => Ordering::Less,
            (FileType::File, FileType::Directory) => Ordering::Greater,
            (FileType::File, FileType::File) | (FileType::SystemLink, FileType::SystemLink) => {
                // Sort hidden files/links first by comparing the hidden flag
                if self.hidden && !other.hidden {
                    Ordering::Less
                } else if !self.hidden && other.hidden {
                    Ordering::Greater
                } else {
                    self.name.cmp(&other.name)
                }
            }
            (FileType::SystemLink, _) => Ordering::Less,
            (_, FileType::SystemLink) => Ordering::Greater,
        }
    }
}

impl PartialOrd for FileInfo {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Eq for FileInfo {}

impl PartialEq for FileInfo {
    fn eq(&self, other: &Self) -> bool {
        self.name == other.name && self.t == other.t
    }
}

fn convert_path_to_strong(path: &PathBuf, is_directory: bool) -> String {
    let path_str = path.to_string_lossy().to_string();
    if is_directory && !path_str.ends_with('/') {
        return path_str + "/";
    }
    path_str
}

pub fn scan_directory(path: &PathBuf) -> Result<Value, String> {
    if let Ok(entries) = fs::read_dir(path) {
        let mut file_info_list: Vec<FileInfo> = Vec::new();

        for entry in entries {
            if let Ok(entry) = entry {
                let file_name = entry.file_name();
                let file_path = entry.path();
                let metadata = entry.metadata();

                if let (Some(name), Ok(metadata)) = (file_name.to_str(), metadata) {
                    let file_type = if metadata.is_dir() {
                        FileType::Directory
                    } else if metadata.is_file() {
                        FileType::File
                    } else {
                        FileType::SystemLink
                    };


                    file_info_list.push(FileInfo {
                        name: name.to_string(),
                        t: file_type,
                        path: convert_path_to_strong(&file_path, metadata.is_dir()),
                        hidden: name.starts_with("."),
                    });
                }
            }
        }

        file_info_list.sort();

        return Ok(json!({
            "path": path,
            "files": file_info_list
        }));
    }
    Err(format!("Path {:?} not found.", path))
}
