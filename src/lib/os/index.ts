import { invoke } from '@tauri-apps/api/core';
import { emit } from '@tauri-apps/api/event';
import { openPath } from '@tauri-apps/plugin-opener';
import { errorLog } from '@/lib/log';

export async function openFile(path: string) {
	try {
		await openPath(path);
	} catch (e) {
		await errorLog(`${e}. Path: ${path}`);
	}
}

export async function getKernelVersion(): Promise<string> {
	return (await invoke('kernel_version')) || 'UNKNOWN';
}

export async function resizeSession(id: string, rows: number, cols: number) {
	await emit(id, {
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
export async function writeToSession(id: string, data: string) {
	await emit(id, {
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
export async function initializeSession(id: string) {
	await emit('manager', {
		type: 'Initialize',
		payload: {
			id,
		},
	});
}

export async function terminateSession(id: string) {
	await writeToSession(id, 'exit\n');
}

export async function updateCurrentSession(id: string) {
	await emit('manager', {
		type: 'Switch',
		payload: {
			id,
		},
	});
}
