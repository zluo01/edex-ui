import { cn } from '@/lib/utils';
import { For } from 'solid-js';

interface ITerminalSelectionTab {
  active: () => number;
  terminalIds: () => number[];
  switchTab: (id: number) => void;
  addTerminal: VoidFunction;
}

function TerminalSelectionTab(props: ITerminalSelectionTab) {
  function generateTabStyle(current: number) {
    const styles: string[] = [
      'border-default/75 w-full skew-x-[35deg] cursor-pointer py-2 max-w-[15%] min-w-[10%] text-center overflow-hidden border-r-2 border-solid',
    ];
    if (props.active() === current) {
      styles.push('bg-active text-active font-medium skew-x-[35deg] scale-125');
    } else {
      styles.push('bg-main text-main');
    }
    return cn(...styles);
  }

  return (
    <div class="flex w-full flex-row flex-nowrap items-center overflow-hidden rounded-t-sm border-b-2 border-default/75 p-0 font-united_sans_medium">
      <div class="no-scrollbar flex w-[95%] appearance-none flex-row items-start overflow-y-hidden overflow-x-scroll">
        <For each={props.terminalIds()}>
          {id => (
            <div
              id={`#${id}`}
              class={generateTabStyle(id)}
              onMouseDown={() => props.switchTab(id)}
            >
              <p class="m-0 skew-x-[-35deg] sm:text-xs md:text-base lg:text-xl xl:text-3xl">
                {id === 0 ? 'MAIN' : `#${id}`}
              </p>
            </div>
          )}
        </For>
      </div>
      <div
        onMouseDown={() => props.addTerminal()}
        class="flex h-full w-[5%] skew-x-[45deg] cursor-pointer items-center justify-center border-l border-solid border-default/75 bg-hover font-normal text-hover sm:text-xs md:text-base lg:text-xl xl:text-3xl"
      >
        <svg
          class="size-6 skew-x-[-45deg] fill-current"
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
