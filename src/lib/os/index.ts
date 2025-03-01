import { errorLog } from '@/lib/log';
import { IIPAddressInformation } from '@/models';
import { invoke } from '@tauri-apps/api/core';
import { emit } from '@tauri-apps/api/event';
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

export async function fitTerminal(id: number, rows: number, cols: number) {
  await emit('resize-' + id, { rows, cols });
}

/**
 * Write data from the terminal to the pty
 * @param id terminal id
 * @param data payload
 */
export async function writeToPty(id: number, data: string) {
  await emit('writer-' + id, data);
}

/**
 * Create a new terminal and return pid
 * @param id terminal index
 */
export async function newTerminalSession(id: number): Promise<number> {
  return await invoke('new_terminal_session', { id });
}

export async function updateCurrentPid(pid: number) {
  await invoke('update_current_pid', { pid });
}
