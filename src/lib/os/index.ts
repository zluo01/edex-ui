import { invoke } from '@tauri-apps/api/core';
import { emit } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-shell';

export async function openFile(path: string) {
  await open(path);
}

export async function getKernelVersion(): Promise<string> {
  return (await invoke('kernel_version')) || 'UNKNOWN';
}

export async function resizeSession(id: number, rows: number, cols: number) {
  await emit('terminal-' + id, {
    type: 'Resize',
    payload: {
      cols,
      rows,
    },
  });
}

/**
 * Write data from the terminal to the pty
 * @param id terminal id
 * @param data payload
 */
export async function writeToSession(id: number, data: string) {
  await emit('terminal-' + id, {
    type: 'Write',
    payload: {
      data,
    },
  });
}

/**
 * Create a new terminal and return pid
 * @param id terminal index
 */
export async function initializeSession(id: number) {
  await emit('manager', {
    type: 'Initialize',
    payload: {
      id,
    },
  });
}

export async function terminateSession(id: number) {
  await writeToSession(id, 'exit\n');
}

export async function updateCurrentSession(id: number) {
  await emit('manager', {
    type: 'Switch',
    payload: {
      id,
    },
  });
}
