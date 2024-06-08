import TerminalSelectionTab from '@/components/terminal/tab';
import XTerm from '@/components/terminal/xTerm';
import { updateTerminal } from '@/lib/os';
import { ITerminalContainer, ITerminalDestroyPayload } from '@/models';
import { useCurrentTheme } from '@/themes';
import { Event, listen } from '@tauri-apps/api/event';
import clsx from 'clsx';
import { createEffect, createSignal, For, on, onCleanup } from 'solid-js';

import './index.css';

function TerminalSection() {
  const theme = useCurrentTheme();

  const [active, setActive] = createSignal(0);

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

  const unListen = listen('destroy', (e: Event<ITerminalDestroyPayload>) => {
    const { deleted, newIndex } = e.payload;
    setTerminals(prevState => prevState.filter(o => o.id !== deleted));
    setActive(newIndex);
  });

  onCleanup(() => {
    unListen.then(f => f()).catch(e => console.error(e));
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
    await updateTerminal(index);
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
