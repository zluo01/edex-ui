import TerminalSelectionTab from '@/components/terminal/tab';
import XTerm from '@/components/terminal/xTerm';
import classNames from '@/lib/utils/style';
import ThemeContext from '@/themes/provider';
import { useContext, useEffect, useState } from 'react';

import './index.css';

function TerminalSection() {
  const theme = useContext(ThemeContext);

  const [active, setActive] = useState(0);

  const [terminals, setTerminals] = useState([
    <XTerm key={0} id={0} theme={theme} />,
  ]);

  useEffect(() => {
    const item = document.getElementById(`#${active}`);
    if (item) {
      item.scrollIntoView({ behavior: 'smooth', inline: 'center' });
    }
  }, [active]);

  function addTerminal() {
    const newTerminals = [
      ...terminals,
      <XTerm key={terminals.length} id={terminals.length} theme={theme} />,
    ];
    setTerminals(newTerminals);
    setActive(newTerminals.length - 1);
  }

  function switchTerminal(index: number) {
    setActive(index);
  }

  function TerminalView() {
    return (
      <div className="m-0 h-full w-full overflow-hidden">
        {terminals[active]}
      </div>
    );
  }

  return (
    <section className="relative h-full w-[68vw] overflow-hidden pt-[2.5vh] sm:px-1 md:px-2 lg:px-3">
      <div
        className={classNames(
          theme.name,
          'shell flex h-full w-full flex-col items-start justify-start',
        )}
        augmented-ui="bl-clip tr-clip exe"
      >
        <TerminalSelectionTab
          addTerminal={addTerminal}
          index={active}
          size={terminals.length}
          switchTab={switchTerminal}
        />
        <TerminalView />
      </div>
    </section>
  );
}

export default TerminalSection;
