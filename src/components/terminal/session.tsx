import { errorLog, traceLog } from '@/lib/log';
import {
  initializeSession,
  resizeSession,
  updateCurrentSession,
  writeToSession,
} from '@/lib/os';
import { Addons, createTerminal } from '@/lib/terminal';
import { useTheme } from '@/lib/themes';
import generateTerminalTheme from '@/lib/themes/terminal';
import { cn } from '@/lib/utils';
import { ITerminalProps } from '@/models';
import { Event, listen } from '@tauri-apps/api/event';
import { ITerminalDimensions } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { Accessor, createEffect, createSignal, on, onCleanup } from 'solid-js';

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
    await resizeSession(id, term.rows, term.cols);
  }
}

function useScreenWidth(): Accessor<number> {
  const [screenWidth, setScreenWidth] = createSignal(window.innerWidth);

  window.addEventListener('resize', () => {
    setScreenWidth(window.innerWidth);
  });

  onCleanup(() => {
    window.removeEventListener('resize', () => {
      setScreenWidth(window.innerWidth);
    });
  });

  return screenWidth;
}

interface ISessionProps {
  id: number;
  active: Accessor<number>;
}

// eslint-disable-next-line solid/no-destructure
function Session({ id, active }: ISessionProps) {
  const { theme } = useTheme();

  // fontSize
  const screenWidth = useScreenWidth();
  const fontSize = () => {
    if (screenWidth() < 1920) {
      return 12;
    } else if (screenWidth() < 2560) {
      return 14;
    } else if (screenWidth() < 3840) {
      return 16;
    }
    return 20;
  };

  const [terminalRef, setTerminalRef] = createSignal<HTMLDivElement>();

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
          await updateCurrentSession(id);
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
        terminal = await createTerminal(ref, theme(), fontSize());

        await initializeSession(id);

        await resize(id, terminal.term, terminal.addons);

        terminal.term.onData(v => writeToSession(id, v));

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
      class={cn(active() !== id && 'hidden', 'size-full p-1.5')}
      ref={setTerminalRef}
    />
  );
}

export default Session;
