import { fitTerminal, newTerminalSession, writeToPty } from '@/lib/os';
import { Addons, createTerminal, ITerminalProps } from '@/lib/terminal';
import { IStyle } from '@/models';
import { Event, listen } from '@tauri-apps/api/event';
import { ITerminalDimensions } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import clsx from 'clsx';
import {
  createEffect,
  createSignal,
  InitializedResource,
  on,
  onCleanup,
} from 'solid-js';

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

async function resize(term: Terminal, addons: Addons) {
  const fitAddon = addons.fit;
  if (!fitAddon.proposeDimensions()) {
    console.error('Fail to get propose dimensions');
    return;
  }
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
  active: () => number;
  theme: InitializedResource<IStyle>;
}

function XTerm({ id, active, theme }: IXtermProps) {
  const [terminalRef, setTerminalRef] = createSignal<HTMLDivElement>();

  let terminal: ITerminalProps | undefined;

  async function resizeTerminal() {
    if (terminal) {
      await resize(terminal.term, terminal.addons);
    }
  }

  createEffect(
    on(terminalRef, async ref => {
      // do not proceed if parent dom is not ready
      // or terminal is already initialized
      if (!ref || terminal !== undefined) {
        return;
      }
      console.debug('Initialize terminal interface. Id: ' + id);
      terminal = createTerminal(ref, theme());

      await newTerminalSession(id);

      await resize(terminal.term, terminal.addons);

      terminal.term.onData(writeToPty);

      addEventListener('resize', resizeTerminal);

      terminal.term.focus();
    }),
  );

  const unListen = listen('data-' + id, (e: Event<string>) =>
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
      class={clsx(active() !== id && 'hidden', 'size-full p-1.5')}
      ref={setTerminalRef}
    />
  );
}

export default XTerm;
