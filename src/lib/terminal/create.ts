import generateTerminalTheme from '@/lib/themes/terminal';
import { IStyle, ITerminalProps } from '@/models';
import { CanvasAddon } from '@xterm/addon-canvas';
import { ClipboardAddon } from '@xterm/addon-clipboard';
import { FitAddon } from '@xterm/addon-fit';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import { WebLinksAddon } from '@xterm/addon-web-links';
import {
  ITerminalInitOnlyOptions,
  Terminal as TerminalType,
  Terminal,
} from '@xterm/xterm';

export type Addons = ReturnType<typeof getAddons>;

const OVERRIDE_KEY_MAP = [
  { key: 'Tab', ctrlKey: true },
  { key: 'W', ctrlKey: true },
  { key: 'T', ctrlKey: true },
];

const INITIAL_DEFAULT_OPTIONS: ITerminalInitOnlyOptions = {
  cols: 80,
  rows: 24,
};

export function createTerminal(
  terminalContainer: HTMLDivElement,
  theme: IStyle,
  initialFontSize: number,
): ITerminalProps {
  const term = new Terminal({
    fontSize: initialFontSize,
    ...INITIAL_DEFAULT_OPTIONS,
    ...generateTerminalTheme(theme),
  });

  const typedTerm = term as TerminalType;

  const addons = getAddons();
  Object.values(addons).forEach(addon => typedTerm.loadAddon(addon));

  term.open(terminalContainer);

  typedTerm.loadAddon(new CanvasAddon());

  term.focus();
  addons.fit.fit();

  setTimeout(() => {
    initAddons(term, addons);
    overrideKeyEvent(term);
  }, 0);

  return { term, addons };
}

function getAddons() {
  return {
    fit: new FitAddon(),
    unicode11: new Unicode11Addon(),
    clipboard: new ClipboardAddon(),
    webLink: new WebLinksAddon(),
  };
}

function initAddons(term: Terminal, _addons: Addons): void {
  term.unicode.activeVersion = '11';
}

function overrideKeyEvent(term: Terminal) {
  term.attachCustomKeyEventHandler(e => {
    if (e.type === 'keydown') {
      for (const i in OVERRIDE_KEY_MAP) {
        if (
          OVERRIDE_KEY_MAP[i].key === e.key.toUpperCase() &&
          OVERRIDE_KEY_MAP[i].ctrlKey === e.ctrlKey
        ) {
          return false;
        }
      }
    }
    return true;
  });
}
