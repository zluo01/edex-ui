use crate::event::main::ProcessEvent;
use chrono::{DateTime, Local};
use log::{error, warn};
#[cfg(target_os = "linux")]
use nvml_wrapper::Nvml;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
#[cfg(target_os = "linux")]
use std::sync::OnceLock;
use std::{
    str,
    time::{Duration, UNIX_EPOCH},
};
use sysinfo::{
    Components, CpuRefreshKind, DiskRefreshKind, Disks, MemoryRefreshKind, Networks,
    ProcessRefreshKind, RefreshKind, System,
};
use tokio::sync::mpsc;

const MEMORY_BAR_WIDTH: f32 = 440.0;

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

#[derive(Serialize, Clone, Debug, PartialEq)]
struct CpuUsage {
    name: String,
    core: usize,
    load: f32,
    usage: Vec<f32>,
    temperature: f32,
}

impl Default for CpuUsage {
    fn default() -> Self {
        Self {
            name: "UNKNOWN".to_string(),
            core: 0,
            load: 0.0,
            usage: vec![],
            temperature: 0.0,
        }
    }
}

#[derive(Serialize, Clone, Debug, PartialEq)]
struct GpuUsage {
    name: String,
    load: f32,
    #[serde(rename = "usedMemory")]
    used_memory: f32,
    #[serde(rename = "totalMemory")]
    total_memory: f32,
    #[serde(rename = "memoryUsage")]
    memory_usage: f32,
    temperature: f32,
}

impl Default for GpuUsage {
    fn default() -> Self {
        #[cfg(target_os = "linux")]
        let name = "Unknown".to_string();

        #[cfg(target_os = "macos")]
        let name = String::new();

        Self {
            name,
            load: 0.0,
            used_memory: 0.0,
            total_memory: 0.0,
            memory_usage: 0.0,
            temperature: 0.0,
        }
    }
}

#[derive(Serialize, Clone, Debug, PartialEq)]
pub struct SystemData {
    uptime: u64,
    memory: MemoryInfo,
    cpu: CpuUsage,
    gpu: GpuUsage,
    processes: Vec<ProcessInfo>,
}

#[derive(Serialize, Clone, Debug, PartialEq)]
pub struct ProcessInfo {
    pid: u32,
    name: String,
    cpu_usage: f32,
    memory_usage: f32,
    state: String,
    start_time: String,
    run_time: u64,
}

#[derive(Debug, Serialize, Clone, PartialEq, Eq, Hash)]
pub struct DiskUsage {
    name: String,
    internal: bool,
    total: u64,
    available: u64,
    usage: u64,
}

#[derive(Serialize, Debug, Clone, PartialEq)]
struct MemoryInfo {
    pub active: f32,
    pub available: f32,
    pub total: f32,
    pub used: f32,
    pub swap: f32,
    pub ratio: f32,
}

fn extract_memory(sys: &System) -> MemoryInfo {
    let used_memory = sys.used_memory() as f32;
    let available_memory = sys.available_memory() as f32;
    let total_memory = sys.total_memory() as f32;

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
    let available = MEMORY_BAR_WIDTH * available_memory / total_memory;

    let used_swap = sys.used_swap() as f32;
    let total_swap = sys.total_swap() as f32;

    let swap_percent = if total_swap > 0.0 {
        (used_swap / total_swap) * 100.0
    } else {
        0.0
    };

    MemoryInfo {
        active: active.round(),
        available: available.round(),
        total: total_memory,
        used: used_memory,
        swap: used_swap,
        ratio: swap_percent.round(),
    }
}

#[cfg(all(target_os = "macos", target_arch = "x86_64"))]
fn extract_cpu_temperature(components: &Components) -> f32 {
    components
        .iter()
        .find(|c| c.label() == "PECI CPU")
        .and_then(|c| c.temperature())
        .unwrap_or(0.0)
}

// Chip SMC: https://github.com/exelban/stats/blob/9671269b399ce1a077d03897a8079fd41a00b691/Modules/CPU/readers.swift#L247
// https://github.com/macmade/Hot/issues/77
#[cfg(all(target_os = "macos", target_arch = "aarch64"))]
fn extract_cpu_temperature(components: &Components) -> f32 {
    let temps: Vec<f32> = components
        .iter()
        .filter(|c| {
            c.label().starts_with("PMU")
                && !c.label().starts_with("PMU2")
                && c.label().contains("tdie")
        })
        .filter_map(|c| c.temperature())
        .collect();

    if !temps.is_empty() {
        temps.iter().sum::<f32>() / temps.len() as f32
    } else {
        0.0
    }
}

#[cfg(target_os = "linux")]
fn extract_cpu_temperature(components: &Components) -> f32 {
    components
        .iter()
        .find(|c| c.label().to_lowercase().contains("tctl"))
        .and_then(|c| c.temperature())
        .unwrap_or(0.0)
}

#[cfg(target_os = "linux")]
static NVML: OnceLock<Option<Nvml>> = OnceLock::new();

#[cfg(target_os = "linux")]
fn init_nvml() -> Option<Nvml> {
    match Nvml::init() {
        Ok(nvml) => Some(nvml),
        Err(e) => {
            warn!(
                "Failed to initialize NVML: {}. GPU temperature will not be available.",
                e
            );
            None
        }
    }
}

#[cfg(target_os = "linux")]
fn get_nvidia_gpu_data() -> GpuUsage {
    let nvml = NVML.get_or_init(init_nvml);

    match nvml {
        Some(nvml) => {
            // Get first GPU (index 0)
            match nvml.device_by_index(0) {
                Ok(device) => {
                    let name = device.name().unwrap_or_else(|_| "UNKNOWN".to_string());

                    let temperature = device
                        .temperature(nvml_wrapper::enum_wrappers::device::TemperatureSensor::Gpu)
                        .unwrap_or(0) as f32;

                    let memory_info = device.memory_info().ok();
                    let (used_memory, total_memory) = match memory_info {
                        Some(info) => (info.used as f32, info.total as f32),
                        None => (0.0, 0.0),
                    };
                    let (load, memory_usage) = device
                        .utilization_rates()
                        .map(|rates| (rates.gpu as f32, rates.memory as f32))
                        .unwrap_or((0.0, 0.0));

                    GpuUsage {
                        name,
                        load,
                        used_memory,
                        total_memory,
                        memory_usage,
                        temperature,
                    }
                }
                Err(e) => {
                    error!("Failed to get GPU data: {}", e);
                    GpuUsage::default()
                }
            }
        }
        None => GpuUsage::default(),
    }
}

#[cfg(target_os = "linux")]
fn extract_gpu_data(_sys: &System, _components: &Components) -> GpuUsage {
    let nvml = NVML.get_or_init(init_nvml);

    match nvml {
        Some(_) => get_nvidia_gpu_data(),
        None => GpuUsage::default(),
    }
}

#[cfg(all(target_os = "macos", target_arch = "x86_64"))]
fn extract_gpu_data(_sys: &System, components: &Components) -> GpuUsage {
    let temperature = components
        .iter()
        .find(|c| c.label() == "GPU")
        .and_then(|c| c.temperature())
        .unwrap_or(0.0);

    GpuUsage {
        name: String::new(),
        load: 0.0,
        used_memory: 0.0,
        total_memory: 0.0,
        memory_usage: 0.0,
        temperature,
    }
}

#[cfg(all(target_os = "macos", target_arch = "aarch64"))]
fn extract_gpu_data(sys: &System, _components: &Components) -> GpuUsage {
    let used_memory = sys.used_memory() as f32;
    let total_memory = sys.total_memory() as f32;

    if total_memory == 0.0 {
        warn!("Something wrong happens. Total memory is 0, returning default values");
        return GpuUsage::default();
    }

    let memory_usage = used_memory / total_memory * 100.0;

    GpuUsage {
        name: String::new(),
        load: 0.0,
        used_memory,
        total_memory,
        memory_usage,
        temperature: 0.0, // should be same as CPU when monitor through IOHID
    }
}

fn extract_cpu_data(sys: &System, components: &Components) -> CpuUsage {
    let cpus = sys.cpus();

    let core_count = cpus.len();

    if core_count == 0 {
        warn!("Something wrong happens. No CPU cores detected");
        return CpuUsage::default();
    }

    let usage: Vec<f32> = sys.cpus().iter().map(|cpu| cpu.cpu_usage()).collect();

    let cpu_name = cpus
        .first()
        .and_then(|cpu| extract_cpu_name(cpu.brand()))
        .unwrap_or_else(|| "UNKNOWN".to_string());

    CpuUsage {
        name: cpu_name,
        core: core_count,
        load: sys.global_cpu_usage(),
        usage,
        temperature: extract_cpu_temperature(components),
    }
}

fn extract_cpu_name(input: &str) -> Option<String> {
    let input = input.trim();

    if input.starts_with("Intel") {
        input.split("CPU").next().map(|s| {
            s.replace("(R)", "®")
                .replace("(TM)", "™")
                .trim()
                .to_string()
        })
    } else if input.starts_with("AMD") {
        Some(
            input
                .split_whitespace()
                .take(4)
                .collect::<Vec<_>>()
                .join(" "),
        )
    } else {
        Some(input.to_string())
    }
}

fn extract_process(sys: &System) -> Vec<ProcessInfo> {
    let total_memory = sys.total_memory();
    let core_count = sys.cpus().len() as f32;

    if core_count == 0.0 || total_memory == 0 {
        warn!(
            "Invalid system state: core_count={}, total_memory={}",
            core_count, total_memory
        );
        return Vec::new();
    }

    let mut processes: Vec<ProcessInfo> = sys
        .processes()
        .iter()
        .map(|(pid, process)| ProcessInfo {
            pid: pid.as_u32(),
            name: process.name().to_string_lossy().to_string(),
            cpu_usage: (process.cpu_usage() / core_count).round(),
            memory_usage: (process.memory() as f32 / total_memory as f32 * 100.0).round(),
            state: process.status().to_string(),
            start_time: epoch_to_date(process.start_time()),
            run_time: process.run_time(),
        })
        .collect();

    processes.sort_by(|a, b| {
        b.cpu_usage
            .partial_cmp(&a.cpu_usage)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    processes
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

    pub async fn run(&mut self) {
        let mut interval = tokio::time::interval(self.refresh_interval);

        loop {
            interval.tick().await;

            // Todo: refresh is the bottleneck here which avg takes 84ms
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
            let memory = extract_memory(&self.system);
            let cpu = extract_cpu_data(&self.system, &self.components);
            let gpu = extract_gpu_data(&self.system, &self.components);
            let network_data = extract_network(&self.networks);
            let disks_data = extract_disk_usage(&self.disks);

            let system_data = SystemData {
                uptime: System::uptime(),
                memory,
                cpu,
                gpu,
                processes: process_data.iter().take(10).cloned().collect(),
            };

            self.send_event(ProcessEvent::System { system_data }, "system");
            self.send_event(ProcessEvent::Network { network_data }, "network");
            self.send_event(ProcessEvent::Disks { disks_data }, "disks");
            self.send_event(ProcessEvent::Process { process_data }, "process");
        }
    }

    fn send_event(&self, event: ProcessEvent, event_type: &str) {
        if let Err(e) = self.event_tx.send(event) {
            error!("Failed to send {} data: {}", event_type, e);
        }
    }
}
