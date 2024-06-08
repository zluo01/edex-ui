import { IStyle } from '@/models';
import clsx from 'clsx';
import { For, InitializedResource } from 'solid-js';

interface ITerminalSelectionTab {
  active: () => number;
  terminalIds: () => number[];
  switchTab: (id: number) => void;
  addTerminal: VoidFunction;
  theme: InitializedResource<IStyle>;
}

function TerminalSelectionTab({
  active,
  terminalIds,
  switchTab,
  addTerminal,
  theme,
}: ITerminalSelectionTab) {
  function generateTabStyle(current: number) {
    const styles: string[] = [
      theme().borderColor['75'],
      'w-full skew-x-[35deg] cursor-pointer py-2 max-w-[15%] min-w-[10%] text-center overflow-hidden border-r-2 border-solid',
    ];
    if (active() === current) {
      styles.push(
        theme().backgroundColor.active,
        theme().textColor.active,
        'font-medium skew-x-[35deg] scale-125',
      );
    } else {
      styles.push(theme().backgroundColor.main, theme().textColor.main);
    }
    return clsx(...styles);
  }

  return (
    <div
      class={clsx(
        theme().borderColor['75'],
        'flex w-full flex-row flex-nowrap items-center rounded-t-sm border-b-2 p-0 font-united_sans_medium',
      )}
    >
      <div class="no-scrollbar flex w-[95%] appearance-none flex-row items-start overflow-y-hidden overflow-x-scroll">
        <For each={terminalIds()}>
          {id => (
            <div
              id={`#${id}`}
              class={generateTabStyle(id)}
              onClick={() => switchTab(id)}
            >
              <p class="m-0 skew-x-[-35deg] sm:text-xs md:text-base lg:text-xl xl:text-3xl">
                {id === 0 ? 'MAIN' : `#${id}`}
              </p>
            </div>
          )}
        </For>
      </div>
      <div
        onClick={addTerminal}
        class={clsx(
          theme().borderColor['75'],
          theme().textColor.hoverActive,
          theme().backgroundColor.hoverActive,
          'flex h-full w-[5%] skew-x-[35deg] cursor-pointer items-center justify-center border-l-2 border-solid font-normal',
          'sm:text-xs md:text-base lg:text-xl xl:text-3xl',
        )}
      >
        <svg
          class="size-6 skew-x-[-35deg] fill-current"
          height="1em"
          viewBox="0 0 448 512"
        >
          <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" />
        </svg>
      </div>
    </div>
  );
}

export default TerminalSelectionTab;
