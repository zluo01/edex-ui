import { Addons } from '@/lib/terminal';
import { Terminal as TerminalType } from '@xterm/xterm';
import { CursorStyle } from '@xterm/xterm/src/common/Types';
import { JSXElement } from 'solid-js';

export interface SystemData {
  uptime: number;
  memory: IMemoryInformation;
  cpu: ICPUData;
  temperature: ITemperatureInformation;
  processes: IProcessInformation[];
}

export interface ITemperatureInformation {
  cpu: number;
  gpu: number;
  battery: number;
}

export interface ICPUData {
  name: string;
  cores: number;
  divide: number;
  load: number[];
  usage: number[];
}

export interface IMemoryInformation {
  active: number;
  available: number;
  total: number;
  used: number;
  swap: number;
  ratio: number;
}

export interface IProcessInformation {
  pid: number;
  name: string;
  cpu_usage: number;
  memory_usage: number;
  state: string;
  start_time: string;
  run_time: number;
}

export interface IIPAddressInformation {
  query: string;
  location: string;
}

export const OFFLINE = 'OFFLINE';
export const ONLINE = 'ONLINE';

export type NETWORK_STATUS = typeof OFFLINE | typeof ONLINE;

export interface INetworkTraffic {
  receive: number;
  transmitted: number;
  totalReceive: number;
  totalTransmitted: number;
}

export interface IDiskUsage {
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

export interface IFileInfo {
  name: string;
  t: FileType;
  path: string;
  hidden: boolean;
}

export interface IFileSystem {
  path: string;
  files: IFileInfo[];
}

export type IStyle = {
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
    cursorStyle: CursorStyle;
    foreground: string;
    background: string;
    cursor: string;
    cursorAccent: string;
  };
};

export interface ITerminalProps {
  term: TerminalType;
  addons: Addons;
}

export interface ITerminalContainer {
  id: number;
  terminal: () => JSXElement;
}
