import { fitTerminal, writeToPty } from '@/lib/os';
import { Addons, createTerminal, ITerminalProps } from '@/lib/terminal';
import { IStyle } from '@/models';
import { Event, listen } from '@tauri-apps/api/event';
import { onCleanup, onMount } from 'solid-js';
import { Terminal } from 'xterm';
import { ITerminalDimensions } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

async function resize(term: Terminal, addons: Addons) {
  const fitAddon = addons.fit;
  let { cols, rows } = fitAddon.proposeDimensions() as ITerminalDimensions;

  // Apply custom fixes based on screen ratio, see #302
  const w = screen.width;
  const h = screen.height;
  let x = 1;
  let y = 0;

  const d = gcd(w, h);

  if (d === 100) {
    y = 1;
    x = 3;
  }

  if (d === 256) {
    x = 2;
  }

  cols = cols + x;
  rows = rows + y;

  if (term.cols !== cols || term.rows !== rows) {
    term.resize(cols, rows);
    fitAddon.fit();
    await fitTerminal(term.rows, term.cols);
  }
}

interface IXtermProps {
  id: number;
  theme: IStyle;
}

function XTerm({ id, theme }: IXtermProps) {
  let terminalRef: HTMLDivElement | undefined;

  let terminal: ITerminalProps | undefined;

  async function resizeTerminal() {
    if (terminal) {
      await resize(terminal.term, terminal.addons);
    }
  }

  onMount(() => {
    terminal = createTerminal(terminalRef!, theme);

    resize(terminal.term, terminal.addons).catch(e => console.error(e));

    terminal.term.onData(writeToPty);

    addEventListener('resize', resizeTerminal);

    terminal.term.focus();
  });

  const unListen = listen('data', (e: Event<string>) =>
    terminal?.term.write(e.payload),
  );

  onCleanup(() => {
    console.debug(id + ' is destroyed.');
    terminal?.term.dispose();
    unListen.then(f => f()).catch(e => console.error(e));
    removeEventListener('resize', resizeTerminal);
  });

  return (
    <div
      id={`terminal-${id}`}
      class="size-full p-1.5"
      ref={el => (terminalRef = el)}
    />
  );
}

export default XTerm;
