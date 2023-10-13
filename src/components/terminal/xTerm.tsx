import { fitTerminal, writeToPty } from '@/lib/os';
import { Addons, createTerminal } from '@/lib/terminal';
import { IStyle } from '@/models';
import { Event, listen } from '@tauri-apps/api/event';
import { createRef, useEffect } from 'react';
import { Terminal } from 'xterm';
import { ITerminalDimensions } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface IXtermProps {
  id: number;
  theme: IStyle;
}

function XTerm({ id, theme }: IXtermProps) {
  const terminalRef = createRef<HTMLDivElement>();

  useEffect(() => {
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

    const { xterm, addons } = createTerminal(terminalRef, theme);

    resize(xterm, addons).catch(e => console.error(e));

    xterm.onData(writeToPty);

    addEventListener('resize', async _ => await resize(xterm, addons));

    const unListen = listen('data', (e: Event<string>) =>
      xterm.write(e.payload),
    );

    xterm.focus();

    return () => {
      xterm.dispose();
      unListen.then(f => f()).catch(e => console.error(e));
      removeEventListener('resize', async () => resize(xterm, addons));
    };
  }, [id, theme, terminalRef]);

  return <div className="h-full w-full p-1.5" ref={terminalRef} />;
}

export default XTerm;
