use crate::event::main::ProcessEvent;
use chrono::{DateTime, Local};
use log::{error, warn};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{
    process::Command,
    str,
    time::{Duration, UNIX_EPOCH},
};
use sysinfo::{
    Components, CpuRefreshKind, DiskRefreshKind, Disks, MemoryRefreshKind, Networks,
    ProcessRefreshKind, RefreshKind, System,
};
use tokio::sync::mpsc;

const BYTES_TO_GB: f64 = 1_073_741_824.0;
const MEMORY_BAR_WIDTH: f64 = 440.0;

#[derive(Serialize, Deserialize, Debug, Clone)]
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
        self.status == "fail"
    }

    pub fn to_json(self) -> Value {
        json!({
            "query": self.query,
            "location": self.get_geo_location()
        })
    }

    fn get_geo_location(&self) -> String {
        if self.is_fail() {
            return "UNKNOWN".to_string();
        }

        let parts: Vec<&str> = [&self.country_code, &self.region, &self.city]
            .iter()
            .filter(|s| !s.is_empty())
            .map(|s| s.as_str())
            .collect();

        parts.join("/")
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
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

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct SystemData {
    uptime: u64,
    memory: MemoryInfo,
    cpu: Value,
    temperature: Temperature,
    processes: Vec<ProcessInfo>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct ProcessInfo {
    pid: u32,
    name: String,
    cpu_usage: f32,
    memory_usage: f32,
    state: String,
    start_time: String,
    run_time: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq, Hash)]
pub struct DiskUsage {
    name: String,
    internal: bool,
    total: u64,
    available: u64,
    usage: u64,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
struct MemoryInfo {
    pub active: f64,
    pub available: f64,
    pub total: f64,
    pub used: f64,
    pub swap: f64,
    pub ratio: f64,
}

fn round_to_1_decimal(value: f64) -> f64 {
    (value * 10.0).round() / 10.0
}

fn extract_memory(sys: &System) -> MemoryInfo {
    let used_memory = sys.used_memory() as f64;
    let free_memory = sys.free_memory() as f64;
    let available_memory = sys.available_memory() as f64;
    let total_memory = sys.total_memory() as f64;

    if total_memory == 0.0 {
        warn!("Something wrong happens. Total memory is 0, returning default values");
        return MemoryInfo {
            active: 0.0,
            available: 0.0,
            total: 0.0,
            used: 0.0,
            swap: 0.0,
            ratio: 0.0,
        };
    }

    let active = MEMORY_BAR_WIDTH * used_memory / total_memory;
    let available = MEMORY_BAR_WIDTH * (available_memory - free_memory) / total_memory;

    let total_gb = round_to_1_decimal(total_memory / BYTES_TO_GB);
    let used_gb = round_to_1_decimal(used_memory / BYTES_TO_GB);

    let used_swap = sys.used_swap() as f64;
    let total_swap = sys.total_swap() as f64;

    let swap_percent = if total_swap > 0.0 {
        (used_swap / total_swap) * 100.0
    } else {
        0.0
    };
    let used_swap_gb = round_to_1_decimal(used_swap / BYTES_TO_GB);

    MemoryInfo {
        active: active.round(),
        available: available.round(),
        total: total_gb,
        used: used_gb,
        swap: used_swap_gb,
        ratio: swap_percent.round(),
    }
}

#[cfg(target_os = "macos")]
fn extract_temperature(components: Components) -> Temperature {
    use std::collections::HashMap;

    let mut temperature: Temperature = Default::default();

    let component_map: HashMap<&str, f32> = components
        .iter()
        .map(|c| (c.label(), c.temperature().unwrap_or(0.0)))
        .collect();

    if let Some(&temp) = component_map.get("PECI CPU") {
        temperature.set_cpu(temp);
    }
    if let Some(&temp) = component_map.get("GPU") {
        temperature.set_gpu(temp);
    }
    if let Some(&temp) = component_map.get("Battery") {
        temperature.set_battery(temp);
    }

    temperature
}

#[cfg(target_os = "linux")]
fn extract_temperature(components: &Components) -> Temperature {
    let mut temperature: Temperature = Default::default();

    if let Some(component) = components
        .iter()
        .find(|c| c.label().to_lowercase().contains("tctl"))
    {
        temperature.set_cpu(component.temperature().unwrap_or(0.0));
    }

    temperature.set_gpu(get_nvidia_gpu_temp());
    temperature
}

#[cfg(target_os = "linux")]
fn get_nvidia_gpu_temp() -> f32 {
    match Command::new("nvidia-smi")
        .args(&[
            "--query-gpu=temperature.gpu",
            "--format=csv,noheader,nounits",
        ])
        .output()
    {
        Ok(output) if output.status.success() => match str::from_utf8(&output.stdout) {
            Ok(result) => result.trim().parse().unwrap_or_else(|e| {
                warn!("Failed to parse GPU temperature: {}", e);
                0.0
            }),
            Err(e) => {
                error!("Failed to parse nvidia-smi output to string: {}", e);
                0.0
            }
        },
        Ok(output) => {
            warn!("nvidia-smi command failed with status: {:?}", output.status);
            0.0
        }
        Err(_e) => 0.0,
    }
}

fn extract_cpu_data(sys: &System) -> Value {
    let cpus = sys.cpus();

    let core_count = cpus.len();

    if core_count == 0 {
        warn!("Something wrong happens. No CPU cores detected");
        return json!({
            "name": "UNKNOWN",
            "cores": 0,
            "divide": 0,
            "load": [0.0, 0.0],
            "usage": []
        });
    }

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

    let cpu_name = cpus
        .first()
        .and_then(|cpu| extract_cpu_name(cpu.brand()))
        .unwrap_or_else(|| "UNKNOWN".to_string());

    json!({
        "name": cpu_name,
        "cores": core_count,
        "divide": divide,
        "load":vec![first_half_usage, second_half_usage],
        "usage": usage
    })
}

fn extract_cpu_name(input: &str) -> Option<String> {
    let input = input.trim();

    if input.starts_with("Intel") {
        return input.split("CPU").next().map(|v| v.to_string());
    }

    if input.starts_with("AMD") {
        return Some(
            input
                .split(' ')
                .into_iter()
                .take(4)
                .collect::<Vec<&str>>()
                .join(" "),
        );
    }
    Some(input.to_string())
}

fn extract_process(sys: &System) -> Vec<ProcessInfo> {
    let mut new_processes = Vec::new(); // Create a new vector to hold the processes
    let total_memory = sys.total_memory();
    let core_count = sys.cpus().len() as f32;

    if core_count == 0.0 || total_memory == 0 {
        warn!(
            "Invalid system state: core_count={}, total_memory={}",
            core_count, total_memory
        );
        return Vec::new();
    }

    for (pid, process) in sys.processes() {
        new_processes.push(ProcessInfo {
            pid: pid.as_u32(),
            name: process.name().to_string_lossy().to_string(),
            cpu_usage: (process.cpu_usage() / core_count).round(),
            memory_usage: (process.memory() as f32 / total_memory as f32 * 100.0).round(),
            state: process.status().to_string(),
            start_time: epoch_to_date(process.start_time()),
            run_time: process.run_time(),
        })
    }

    new_processes.sort_by(|a, b| {
        b.cpu_usage
            .partial_cmp(&a.cpu_usage)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    new_processes
}

fn epoch_to_date(epoch: u64) -> String {
    let d = UNIX_EPOCH + Duration::from_secs(epoch);
    let datetime = DateTime::<Local>::from(d);
    datetime.format("%Y-%m-%d %H:%M:%S").to_string()
}

fn extract_network(networks: &Networks) -> Value {
    let mut network_receive: f64 = 0f64;
    let mut network_transmitted: f64 = 0f64;
    let mut network_total_receive: u64 = 0;
    let mut network_total_transmitted: u64 = 0;
    for (_interface_name, data) in networks {
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

fn extract_disk_usage(disks: &Disks) -> Vec<DiskUsage> {
    let mut disk_usages: Vec<DiskUsage> = disks
        .iter()
        .map(|disk| {
            let total_space = disk.total_space();
            let available_space = disk.available_space();
            let used_space = total_space.saturating_sub(available_space);
            let usage_percent = if total_space > 0 {
                (used_space * 100) / total_space
            } else {
                0
            };

            DiskUsage {
                name: disk.name().to_string_lossy().to_string(),
                internal: !disk.is_removable(),
                total: total_space,
                available: available_space,
                usage: usage_percent,
            }
        })
        .collect();

    disk_usages.sort_unstable_by(|a, b| {
        b.internal
            .cmp(&a.internal)
            .then_with(|| a.name.cmp(&b.name))
    });
    disk_usages.dedup_by(|a, b| a.name == b.name && a.internal == b.internal);

    disk_usages
}

pub struct SystemMonitor {
    system: System,
    networks: Networks,
    disks: Disks,
    components: Components,
    refresh_interval: Duration,
    event_tx: mpsc::UnboundedSender<ProcessEvent>,
}

impl SystemMonitor {
    pub fn new(refresh_interval_secs: u64, event_tx: mpsc::UnboundedSender<ProcessEvent>) -> Self {
        let system = System::new_with_specifics(
            RefreshKind::nothing()
                .with_memory(MemoryRefreshKind::everything())
                .with_cpu(CpuRefreshKind::everything())
                .with_processes(ProcessRefreshKind::nothing().with_cpu().with_memory()),
        );

        let networks = Networks::new_with_refreshed_list();
        let disks = Disks::new_with_refreshed_list_specifics(
            DiskRefreshKind::everything().without_io_usage(),
        );
        let components = Components::new_with_refreshed_list();

        Self {
            system,
            networks,
            disks,
            components,
            refresh_interval: Duration::from_secs(refresh_interval_secs),
            event_tx,
        }
    }

    pub async fn start_monitoring(
        &mut self,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let mut interval = tokio::time::interval(self.refresh_interval);

        loop {
            interval.tick().await;

            self.system.refresh_specifics(
                RefreshKind::nothing()
                    .with_memory(MemoryRefreshKind::everything())
                    .with_cpu(CpuRefreshKind::everything())
                    .with_processes(ProcessRefreshKind::nothing().with_cpu().with_memory()),
            );

            // Refresh separate modules
            self.networks.refresh(true);
            self.disks
                .refresh_specifics(true, DiskRefreshKind::everything().without_io_usage()); // refresh_list = true to detect new/removed disks
            self.components.refresh(true);

            let process_data = extract_process(&self.system);
            let system_data = SystemData {
                uptime: System::uptime(),
                memory: extract_memory(&self.system),
                cpu: extract_cpu_data(&self.system),
                temperature: extract_temperature(&self.components),
                processes: process_data.iter().take(10).cloned().collect::<Vec<_>>(),
            };

            match self.event_tx.send(ProcessEvent::System { system_data }) {
                Ok(_) => {}
                Err(e) => error!("Fail to send system data to consumer. Error: {}", e),
            }

            match self.event_tx.send(ProcessEvent::Network {
                network_data: extract_network(&self.networks),
            }) {
                Ok(_) => {}
                Err(e) => error!("Fail to send network data to consumer. Error: {}", e),
            }

            match self.event_tx.send(ProcessEvent::Disks {
                disks_data: extract_disk_usage(&self.disks),
            }) {
                Ok(_) => {}
                Err(e) => error!("Fail to send network data to consumer. Error: {}", e),
            }

            match self.event_tx.send(ProcessEvent::Process { process_data }) {
                Ok(_) => {}
                Err(e) => error!("Fail to send network data to consumer. Error: {}", e),
            }
        }
    }
}
