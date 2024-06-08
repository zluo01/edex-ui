import THEME_LIST from '@/lib/themes/styles';
import { IStyle } from '@/models';
import { Store } from 'tauri-plugin-store-api';

const store = new Store('.settings.dat');

export async function getShowHiddenFileStatus(): Promise<boolean> {
  return (await store.get('showHiddenFile')) || false;
}

export async function setShowHiddenFileStatus(status: boolean) {
  await store.set('showHiddenFile', status);
}

export async function getTheme(): Promise<IStyle> {
  return (await store.get('theme')) || THEME_LIST[0];
}

export async function setTheme(theme: IStyle) {
  await store.set('theme', theme);
}
