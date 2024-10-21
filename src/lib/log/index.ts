import { error, trace } from '@tauri-apps/plugin-log';

export async function errorLog(msg: unknown) {
  if (typeof msg === 'string') {
    await error(msg);
  } else if (msg instanceof Error) {
    await error(msg.message);
  } else {
    await error(String(msg));
  }
}

export async function traceLog(msg: string) {
  await trace(msg);
}
