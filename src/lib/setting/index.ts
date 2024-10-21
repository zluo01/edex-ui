import THEME_LIST from '@/lib/themes/styles';
import { IStyle } from '@/models';
import { Store } from '@tauri-apps/plugin-store';

const store = await Store.load('.settings.dat', {
  // we can save automatically after each store modification
  autoSave: true,
});

export async function getShowHiddenFileStatus(): Promise<boolean> {
  return (await store.get<boolean>('showHiddenFile')) || false;
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
