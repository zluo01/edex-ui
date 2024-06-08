import { IStyle } from '@/models';
import generateTerminalTheme from '@/themes/terminal';
import { CanvasAddon } from '@xterm/addon-canvas';
import { ClipboardAddon } from '@xterm/addon-clipboard';
import { FitAddon } from '@xterm/addon-fit';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { Terminal as TerminalType, Terminal } from '@xterm/xterm';

export type Addons = ReturnType<typeof getAddons>;

export interface ITerminalProps {
  term: TerminalType;
  addons: Addons;
}

export function createTerminal(
  terminalContainer: HTMLDivElement,
  theme: IStyle,
): ITerminalProps {
  const term = new Terminal(generateTerminalTheme(theme));

  const typedTerm = term as TerminalType;

  const addons = getAddons();
  Object.values(addons).forEach(addon => typedTerm.loadAddon(addon));

  term.open(terminalContainer);

  typedTerm.loadAddon(new CanvasAddon());

  term.focus();
  addons.fit.fit();

  setTimeout(() => {
    initAddons(term, addons);
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
