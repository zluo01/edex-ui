import TerminalSelectionTab from '@/components/terminal/tab';
import XTerm from '@/components/terminal/xTerm';
import { errorLog } from '@/lib/log';
import { writeToPty } from '@/lib/os';
import { useTerminal } from '@/lib/terminal';
import { useCurrentTheme } from '@/lib/themes';
import { ITerminalContainer } from '@/models';
import { createShortcut } from '@solid-primitives/keyboard';
import { Event, listen } from '@tauri-apps/api/event';
import clsx from 'clsx';
import { createEffect, createSignal, For, on, onCleanup } from 'solid-js';

import './index.css';

function nextActiveTerminal(target: number, keys: number[]) {
  // Base Case
  if (keys[0] > target || keys[keys.length - 1] <= target) {
    return keys[0];
  }

  let l = 0;
  let h = keys.length;
  while (l < h) {
    const mid = l + Math.floor((h - l) / 2);
    if (keys[mid] > target) {
      h = mid;
    } else {
      l = mid + 1;
    }
  }
  return keys[l % keys.length];
}

function TerminalSection() {
  const theme = useCurrentTheme();
  const { active, setActive } = useTerminal();

  const [terminals, setTerminals] = createSignal<ITerminalContainer[]>([
    {
      id: 0,
      terminal: () => <XTerm id={0} active={active} theme={theme} />,
    },
  ]);

  const terminalIds = () => terminals().map(o => o.id);

  createEffect(
    on(active, active => {
      const item = document.getElementById(`#${active}`);
      if (item) {
        item.scrollIntoView({ behavior: 'smooth', inline: 'center' });
      }
    }),
  );

  createShortcut(
    ['Control', 'Tab'],
    () => {
      if (terminalIds().length === 1) {
        return;
      }
      setActive(prevState => nextActiveTerminal(prevState, terminalIds()));
    },
    { preventDefault: true },
  );

  createShortcut(
    ['Control', 'W'],
    async () => {
      await writeToPty(active(), 'exit\n');
    },
    { preventDefault: true },
  );

  createShortcut(['Control', 'T'], () => addTerminal(), {
    preventDefault: true,
  });

  const unListen = listen('destroy', (e: Event<number>) => {
    const id = e.payload;
    const nextIndex = nextActiveTerminal(id, terminalIds());
    setTerminals(prevState => prevState.filter(o => o.id !== id));
    setActive(nextIndex);
  });

  onCleanup(() => {
    unListen.then(f => f()).catch(errorLog);
  });

  /**
   * Create new terminal node
   * Internally, will create a new pty sessions in the backend
   * it will also handle updating the current index on creation.
   */
  function addTerminal() {
    const id = terminals().length;
    setActive(id);
    setTerminals(prevState => [
      ...prevState,
      {
        id,
        terminal: () => <XTerm id={id} active={active} theme={theme} />,
      },
    ]);
  }

  async function switchTerminal(index: number) {
    setActive(index);
  }

  return (
    <section class="relative h-full w-[68vw] overflow-hidden pt-[2.5vh] sm:px-1 md:px-2 lg:px-3">
      <div
        class={clsx(
          theme().name,
          'shell flex size-full flex-col items-start justify-start',
        )}
        data-augmented-ui="bl-clip tr-clip border"
      >
        <TerminalSelectionTab
          addTerminal={addTerminal}
          active={active}
          terminalIds={terminalIds}
          switchTab={switchTerminal}
          theme={theme}
        />
        <div class="m-0 size-full overflow-hidden">
          <For each={terminals()}>{({ terminal }) => terminal()}</For>
        </div>
      </div>
    </section>
  );
}

export default TerminalSection;
