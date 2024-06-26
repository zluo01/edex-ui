import { errorLog, traceLog } from '@/lib/log';
import {
  fitTerminal,
  newTerminalSession,
  updateCurrentPid,
  writeToPty,
} from '@/lib/os';
import { Addons, createTerminal } from '@/lib/terminal';
import generateTerminalTheme from '@/lib/themes/terminal';
import { IStyle, ITerminalProps } from '@/models';
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

async function resize(id: number, term: Terminal, addons: Addons) {
  const fitAddon = addons.fit;
  if (!fitAddon.proposeDimensions()) {
    await errorLog('Fail to get propose dimensions');
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
    await fitTerminal(id, term.rows, term.cols);
  }
}

function terminalFontSize(): () => number {
  const [screenWidth, setScreenWidth] = createSignal(window.innerWidth);

  window.addEventListener('resize', () => {
    setScreenWidth(window.innerWidth);
  });

  onCleanup(() => {
    window.removeEventListener('resize', () => {
      setScreenWidth(window.innerWidth);
    });
  });

  return () => {
    if (screenWidth() < 1920) {
      return 12;
    } else if (screenWidth() < 2560) {
      return 14;
    } else if (screenWidth() < 3840) {
      return 16;
    }
    return 20;
  };
}

interface IXtermProps {
  id: number;
  active: () => number;
  theme: InitializedResource<IStyle>;
}

function XTerm({ id, active, theme }: IXtermProps) {
  const fontSize = terminalFontSize();
  const [terminalRef, setTerminalRef] = createSignal<HTMLDivElement>();

  let pid: number | undefined;
  let terminal: ITerminalProps | undefined;

  async function resizeTerminal(id: number) {
    if (terminal) {
      await resize(id, terminal.term, terminal.addons);
    }
  }

  // refocus on tab change
  createEffect(
    on(active, async active => {
      try {
        if (active === id) {
          await resizeTerminal(id);
          terminal?.term.focus();
          if (pid) {
            await updateCurrentPid(pid);
          }
        } else {
          terminal?.term.blur();
        }
      } catch (e) {
        await errorLog(e);
      }
    }),
  );

  // sync terminal theme
  createEffect(
    on(theme, async theme => {
      if (terminal?.term) {
        terminal.term.options = { ...generateTerminalTheme(theme) };
      }
    }),
  );

  // sync terminal font size
  createEffect(
    on(fontSize, async fontSize => {
      if (terminal?.term) {
        terminal.term.options.fontSize = fontSize;
      }
    }),
  );

  createEffect(
    on(terminalRef, async ref => {
      // do not proceed if parent dom is not ready
      // or terminal is already initialized
      if (!ref || terminal !== undefined) {
        return;
      }
      try {
        await traceLog('Initialize terminal interface. Id: ' + id);
        terminal = createTerminal(ref, theme(), fontSize());

        pid = await newTerminalSession(id);

        await resize(id, terminal.term, terminal.addons);

        terminal.term.onData(v => writeToPty(id, v));

        addEventListener('resize', () => resizeTerminal(id));

        terminal.term.focus();
      } catch (e) {
        await errorLog(e);
      }
    }),
  );

  const unListen = listen('data-' + id, (e: Event<string>) =>
    terminal?.term.write(e.payload),
  );

  onCleanup(() => {
    terminal?.term.dispose();
    unListen.then(f => f()).catch(errorLog);
    removeEventListener('resize', () => resizeTerminal(id));
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
