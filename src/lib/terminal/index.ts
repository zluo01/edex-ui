/**
 * Copyright (c) 2018 The xterm.js authors. All rights reserved.
 * @license MIT
 *
 * This file is the entry point for browserify.
 */
import { IStyle } from '@/models';
import generateTerminalTheme from '@/themes/terminal';
import { Terminal as TerminalType, Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { Unicode11Addon } from 'xterm-addon-unicode11';
import { WebLinksAddon } from 'xterm-addon-web-links';

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
  typedTerm.loadAddon(new WebLinksAddon());
  typedTerm.loadAddon(addons.fit);
  typedTerm.loadAddon(addons.unicode11);

  term.open(terminalContainer);
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
  };
}

function initAddons(term: Terminal, _addons: Addons): void {
  term.unicode.activeVersion = '11';
}
