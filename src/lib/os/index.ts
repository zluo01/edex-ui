import { errorLog } from '@/lib/log';
import { IIPAddressInformation } from '@/models';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-shell';

export async function openFile(path: string) {
  await open(path);
}

export async function getKernelVersion(): Promise<string> {
  return (await invoke('kernel_version')) || 'UNKNOWN';
}

export async function getIPInformation(): Promise<IIPAddressInformation> {
  return await invoke('get_ip_information');
}

export async function getNetworkLatency(): Promise<string> {
  try {
    const latency = await invoke('get_network_latency');
    return `${latency}ms`;
  } catch (e) {
    await errorLog(e);
    return '--';
  }
}

export async function resizeSession(id: number, rows: number, cols: number) {
  await invoke('resize_session', { id, rows, cols });
}

/**
 * Write data from the terminal to the pty
 * @param id terminal id
 * @param data payload
 */
export async function writeToSession(id: number, data: string) {
  await invoke('write_to_session', { id, data });
}

/**
 * Create a new terminal and return pid
 * @param id terminal index
 */
export async function initializeSession(id: number) {
  await invoke('initialize_session', { id });
}

export async function terminateSession(id: number) {
  await invoke('terminate_session', { id });
}

export async function updateCurrentSession(id: number) {
  await invoke('update_current_session', { id });
}
