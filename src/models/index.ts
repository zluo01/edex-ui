import { CursorStyle } from 'xterm/src/common/Types';

export interface ICPUData {
  name: string;
  cores: number;
  divide: number;
  temperature: ITemperatureInformation;
  load: number[];
  usage: number[];
}

export interface ITemperatureInformation {
  cpu: number;
  gpu: number;
  battery: number;
}

export interface IMemoryInformation {
  active: number;
  available: number;
  total: string;
  used: string;
  swap: string;
  ratio: number;
}

export interface IProcessInformation {
  pid: number;
  name: string;
  uid: string;
  cpu_usage: number;
  memory_usage: number;
  state: string;
  start_time: number;
  run_time: number;
}

export interface IIPAddressInformation {
  query: string;
  location: string;
}

export interface INetworkInformation {
  status: NETWORK_STATUS;
  information?: IIPAddressInformation;
}

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

export const UNKNOWN = 'UNKNOWN';
export const OFFLINE = 'OFFLINE';
export const ONLINE = 'ONLINE';

export type NETWORK_STATUS = typeof UNKNOWN | typeof OFFLINE | typeof ONLINE;

export interface IStyle {
  name: string;
  backgroundColor: {
    main: string;
    secondary: string;
    active: string;
    hoverActive: string;
  };
  borderColor: {
    default: string;
    30: string;
    75: string;
    80: string;
    top: string;
    bottom: string;
  };
  textColor: {
    main: string;
    active: string;
    hoverActive: string;
  };
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
}
