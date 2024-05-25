import TerminalSelectionTab from '@/components/terminal/tab';
import XTerm from '@/components/terminal/xTerm';
import THEME_LIST from '@/themes/styles';
import clsx from 'clsx';
import { createEffect, createSignal, on } from 'solid-js';

import './index.css';

function TerminalSection() {
  const [active, setActive] = createSignal(0);

  const terminals = [<XTerm id={0} theme={THEME_LIST[0]} />];

  createEffect(
    on(active, active => {
      const item = document.getElementById(`#${active}`);
      if (item) {
        item.scrollIntoView({ behavior: 'smooth', inline: 'center' });
      }
    }),
  );

  function addTerminal() {
    terminals.push(<XTerm id={terminals.length} theme={THEME_LIST[0]} />);
    setActive(terminals.length - 1);
  }

  function switchTerminal(index: number) {
    setActive(index);
  }

  return (
    <section class="relative h-full w-[68vw] overflow-hidden pt-[2.5vh] sm:px-1 md:px-2 lg:px-3">
      <div
        class={clsx(
          THEME_LIST[0].name,
          'shell flex size-full flex-col items-start justify-start',
        )}
        augmented-ui="bl-clip tr-clip exe"
      >
        <TerminalSelectionTab
          addTerminal={addTerminal}
          active={active}
          size={terminals.length}
          switchTab={switchTerminal}
        />
        <div class="m-0 size-full overflow-hidden">{terminals[0]}</div>
      </div>
    </section>
  );
}

export default TerminalSection;
