use std::path::PathBuf;
use std::process::Command;
use std::str;

use log::error;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sysinfo::{ComponentExt, CpuExt, DiskExt, NetworkExt, PidExt, ProcessExt, System, SystemExt};

#[derive(Serialize, Deserialize)]
pub struct IPInformation {
    query: String,
    status: String,
    #[serde(rename = "countryCode")]
    country_code: String,
    region: String,
    city: String,
}

impl IPInformation {
    pub fn is_fail(&self) -> bool {
        self.status.eq("fail")
    }

    pub fn to_json(self) -> Value {
        json!({
            "query": self.query,
            "location": self.get_geo_location()
        })
    }

    fn get_geo_location(&self) -> String {
        if self.is_fail() {
            return String::from("UNKNOWN");
        }
        let mut location = String::new();

        if !self.country_code.is_empty() {
            location += &self.country_code;
        }

        if !self.region.is_empty() {
            if !location.is_empty() {
                location += "/";
            }
            location += &self.region;
        }

        if !self.city.is_empty() {
            if !location.is_empty() {
                location += "/";
            }
            location += &self.city;
        }

        location
    }
}

#[derive(Serialize, Deserialize)]
struct Temperature {
    cpu: f32,
    gpu: f32,
    battery: f32,
}

impl Default for Temperature {
    fn default() -> Self {
        Self {
            cpu: 0f32,
            gpu: 0f32,
            battery: 0f32,
        }
    }
}

impl Temperature {
    pub fn set_cpu(&mut self, cpu: f32) {
        self.cpu = cpu;
    }
    pub fn set_gpu(&mut self, gpu: f32) {
        self.gpu = gpu;
    }
    pub fn set_battery(&mut self, battery: f32) {
        self.battery = battery;
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Process {
    pid: u32,
    name: String,
    cpu_usage: f32,
    memory_usage: f32,
    state: String,
    start_time: u64,
    run_time: u64,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Hash)]
struct DiskUsage {
    name: String,
    internal: bool,
    total: u64,
    available: u64,
    usage: u64,
}

pub fn extract_memory(sys: &System) -> Value {
    let used_memory = sys.used_memory() as f64;
    let free_memory = sys.free_memory() as f64;
    let available_memory = sys.available_memory() as f64;
    let total_memory = sys.total_memory() as f64;

    let active = 440.0 * used_memory / total_memory;
    let available = 440.0 * (available_memory - free_memory) / total_memory;

    let total = format!("{:.1}", total_memory / 1073741824.0);
    let used = format!("{:.1}", used_memory / 1073741824.0);

    let used_swap = sys.used_swap() as f64;
    let total_swap = sys.total_swap() as f64;

    let use_swap_percent = used_swap / total_swap * 100.0;
    let used_swap = format!("{:.1}", used_swap / 1073741824.0);

    json!({
        "active": active.round(),
        "available": available.round(),
        "total": total,
        "used": used,
        "swap": used_swap,
        "ratio": use_swap_percent
    })
}

#[cfg(target_os = "macos")]
fn extract_temperature(sys: &System) -> Temperature {
    let mut temperature: Temperature = Default::default();

    for component in sys.components() {
        let temp = component.temperature();
        match component.label() {
            "PECI CPU" => temperature.set_cpu(temp),
            "GPU" => temperature.set_gpu(temp),
            "Battery" => temperature.set_battery(temp),
            _ => (),
        }
    }
    temperature
}

#[cfg(target_os = "linux")]
fn extract_temperature(sys: &System) -> Temperature {
    let mut temperature: Temperature = Default::default();

    for component in sys.components() {
        if component.label().to_lowercase().contains("tctl") {
            temperature.set_cpu(component.temperature());
            break;
        }
    }

    temperature.set_gpu(get_nvidia_gpu_temp());
    temperature
}

#[cfg(target_os = "linux")]
fn get_nvidia_gpu_temp() -> f32 {
    let response = Command::new("nvidia-smi")
        .args(&["--query-gpu=temperature.gpu", "--format=csv,noheader,nounits"])
        .output();

    if let Err(e) = response {
        error!("Fail to run command. Error: {}", e);
        return 0.0;
    }

    let output = response.unwrap();
    if output.status.success() {
        let result = str::from_utf8(&output.stdout);
        if let Err(e) = result {
            error!("Fail to parse terminal output to string. Error: {:?}. Output: {:?}", e, &output.stdout)
        }
        return result.unwrap().trim().parse().unwrap_or(0.0);
    }
    error!("Command failed with error: {:?}", output.status);
    return 0.0;
}

pub fn extract_cpu_data(sys: &System) -> Value {
    let cpus = sys.cpus();

    let core_count = cpus.len();

    let divide = core_count / 2;

    let mut first_half_usage: f32 = 0.0;
    let mut second_half_usage: f32 = 0.0;
    let mut usage: Vec<f32> = Vec::with_capacity(core_count);

    for (index, value) in cpus.iter().enumerate() {
        let cpu_usage = value.cpu_usage();
        if index < divide {
            first_half_usage += cpu_usage;
        } else {
            second_half_usage += cpu_usage;
        }
        usage.push(cpu_usage);
    }

    first_half_usage /= divide as f32;
    second_half_usage /= (core_count - divide) as f32;


    let temp = extract_temperature(sys);

    let cpu_name = extract_cpu_name(sys.global_cpu_info().brand())
        .unwrap_or(String::from("UNKNOWN"));
    json!({
        "name": cpu_name,
        "cores": core_count,
        "divide": divide,
        "temperature": temp,
        "load":vec![first_half_usage, second_half_usage],
        "usage": usage
    })
}

fn extract_cpu_name(input: &str) -> Option<String> {
    if input.starts_with("Intel") {
        return input.split("CPU").next().map(|v| v.to_string());
    }

    if input.starts_with("AMD") {
        return Some(input.split(' ').into_iter().take(4).collect::<Vec<&str>>().join(" "));
    }
    None
}

pub fn extract_process(sys: &System) -> Vec<Process> {
    let mut new_processes = Vec::new(); // Create a new vector to hold the processes
    let total_memory = sys.total_memory();
    let core_count = sys.cpus().len() as f32;
    for (pid, process) in sys.processes() {
        new_processes.push(Process {
            pid: pid.as_u32(),
            name: process.name().parse().unwrap(),
            cpu_usage: (process.cpu_usage() / core_count).round(),
            memory_usage: (process.memory() as f32 / total_memory as f32 * 100.0).round(),
            state: process.status().to_string(),
            start_time: process.start_time(),
            run_time: process.run_time(),
        })
    }

    new_processes.sort_by(|a, b| b.cpu_usage.partial_cmp(&a.cpu_usage).unwrap());
    new_processes
}

pub fn extract_network(sys: &System) -> Value {
    let mut network_receive: f64 = 0f64;
    let mut network_transmitted: f64 = 0f64;
    let mut network_total_receive: u64 = 0;
    let mut network_total_transmitted: u64 = 0;
    for (_interface_name, data) in sys.networks() {
        network_receive += data.received() as f64;
        network_transmitted += data.transmitted() as f64;

        network_total_receive += data.total_received();
        network_total_transmitted += data.total_transmitted();
    }

    json!({
        "received": network_receive,
        "transmitted": network_transmitted,
        "totalReceive": network_total_receive,
        "totalTransmitted": network_total_transmitted,
    })
}

pub fn extract_disk_usage(sys: &System) -> Value {
    let mut disk_usages: Vec<DiskUsage> = Vec::new();

    for disk in sys.disks() {
        disk_usages.push(DiskUsage {
            name: disk.name().to_str().unwrap().to_string(),
            internal: !disk.is_removable(),
            total: disk.total_space(),
            available: disk.available_space(),
            usage: disk.available_space() * 100 / disk.total_space(),
        })
    }

    disk_usages.sort_by(|a, b| {
        // Sort by 'internal' (true comes before false)
        let internal_cmp = b.internal.cmp(&a.internal);

        // If 'internal' is the same, sort by 'name'
        if internal_cmp == std::cmp::Ordering::Equal {
            a.name.cmp(&b.name)
        } else {
            internal_cmp
        }
    });
    disk_usages.dedup_by(|a, b| a.name == b.name && a.internal == b.internal);

    json!(disk_usages)
}
