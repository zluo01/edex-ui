import type { Terminal as TerminalType } from '@xterm/xterm';
import type { JSXElement } from 'solid-js';
import type { Addons } from '@/lib/terminal';

export interface SystemData {
	uptime: number;
	memory: MemoryInformation;
	cpu: CPUData;
	gpu: GPUData;
	processes: ProcessInformation[];
}

export interface CPUData {
	name: string;
	core: number;
	load: number;
	usage: number[];
	temperature: number;
}

export interface GPUData {
	name: string;
	load: number;
	usedMemory: number;
	totalMemory: number;
	memoryUsage: number;
	temperature: number;
}

export interface MemoryInformation {
	active: number;
	available: number;
	total: number;
	used: number;
	swap: number;
	ratio: number;
}

export interface ProcessInformation {
	pid: number;
	name: string;
	cpu_usage: number;
	memory_usage: number;
	state: string;
	start_time: string;
	run_time: number;
}

export interface IPInformation {
	query: string;
	status: string;
	countryCode: string;
	region: string;
	city: string;
}

export interface IPAddressInformation {
	query: string;
	location: string;
}

export const OFFLINE = 'OFFLINE';
export const ONLINE = 'ONLINE';

export type NETWORK_STATUS = typeof OFFLINE | typeof ONLINE;

export interface NetworkTrafficStatus {
	receive: number;
	transmitted: number;
	totalReceive: number;
	totalTransmitted: number;
}

export interface DiskUsageStatus {
	name: string;
	internal: boolean;
	total: number;
	available: number;
	usage: number;
}

export const DIRECTORY = 'Directory';
export const FILE = 'File';
export const SYSTEM_LINK = 'SystemLink';
export const SETTING = 'Setting';
export const BACKWARD = 'Backward';

export type FileType =
	| typeof DIRECTORY
	| typeof FILE
	| typeof SYSTEM_LINK
	| typeof SETTING
	| typeof BACKWARD;

export interface FileInfo {
	name: string;
	t: FileType;
	path: string;
	hidden: boolean;
}

export interface FileSystemStatus {
	path: string;
	files: FileInfo[];
}

export type Style = {
	colors: {
		main: string;
		black: string;
		grey: string;
		red?: string;
		green?: string;
		yellow?: string;
		blue?: string;
		magenta?: string;
		cyan?: string;
		white?: string;
		brightBlack?: string;
		brightRed?: string;
		brightGreen?: string;
		brightYellow?: string;
		brightBlue?: string;
		brightMagenta?: string;
		brightCyan?: string;
		brightWhite?: string;
	};
	terminal: {
		fontFamily: string;
		cursorStyle: 'block' | 'underline' | 'bar';
		foreground: string;
		background: string;
		cursor: string;
		cursorAccent: string;
	};
};

export interface TerminalProps {
	term: TerminalType;
	addons: Addons;
}

export interface TerminalContainer {
	id: number;
	terminal: () => JSXElement;
}
