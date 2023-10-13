/**
 * Copyright (c) 2018 The xterm.js authors. All rights reserved.
 * @license MIT
 *
 * This file is the entry point for browserify.
 */
import { IStyle } from '@/models';
import generateTerminalTheme from '@/themes/terminal';
import { RefObject } from 'react';
import { Terminal as TerminalType, Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { Unicode11Addon } from 'xterm-addon-unicode11';
import { WebLinksAddon } from 'xterm-addon-web-links';

export interface IWindowWithTerminal extends Window {
  term: TerminalType;
  Terminal?: typeof TerminalType;
  FitAddon?: typeof FitAddon;
  WebLinksAddon?: typeof WebLinksAddon;
  Unicode11Addon?: typeof Unicode11Addon;
}

export function createTerminal(
  terminalContainer: RefObject<HTMLDivElement>,
  theme: IStyle,
) {
  const term = new Terminal(generateTerminalTheme(theme));

  const typedTerm = term as TerminalType;

  const addons = getAddons();
  typedTerm.loadAddon(new WebLinksAddon());
  typedTerm.loadAddon(addons.fit);
  typedTerm.loadAddon(addons.unicode11);
  term.open(terminalContainer.current as HTMLDivElement);
  term.focus();
  addons.fit.fit();

  setTimeout(() => {
    initAddons(term, addons);
  }, 0);

  return { xterm: term, addons };
}
function getAddons() {
  return {
    fit: new FitAddon(),
    unicode11: new Unicode11Addon(),
  };
}

export type Addons = ReturnType<typeof getAddons>;

function initAddons(
  term: Terminal,
  _addons: ReturnType<typeof getAddons>,
): void {
  term.unicode.activeVersion = '11';
}
