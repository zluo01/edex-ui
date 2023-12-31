import { IIPAddressInformation } from '@/models';
import { open } from '@tauri-apps/api/shell';
import { invoke } from '@tauri-apps/api/tauri';

export async function openFile(path: string) {
  await open(path);
}

export async function getIPInformation(): Promise<IIPAddressInformation> {
  return await invoke('get_ip_information');
}

export async function getNetworkLatency(): Promise<number> {
  return await invoke('get_network_latency');
}

export async function fitTerminal(rows: number, cols: number) {
  await invoke<string>('async_resize_pty', {
    rows,
    cols,
  });
}

/**
 * Write data from the terminal to the pty
 * @param data payload
 */
export async function writeToPty(data: string) {
  await invoke('async_write_to_pty', { data });
}
