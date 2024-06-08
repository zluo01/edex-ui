import { useCurrentTheme } from '@/lib/themes';
import { IMemoryInformation } from '@/models';
import { Event, listen } from '@tauri-apps/api/event';
import clsx from 'clsx';
import { createSignal, onCleanup } from 'solid-js';

function MemInfo() {
  const theme = useCurrentTheme();

  const [memory, setMemory] = createSignal<IMemoryInformation>();

  const unListen = listen('memory', (e: Event<IMemoryInformation>) =>
    setMemory(e.payload),
  );

  onCleanup(() => {
    unListen.then(f => f()).catch(e => console.error(e));
  });

  const memoryMap = () => {
    const backgroundColor = theme().backgroundColor.active;

    if (!memory()) {
      return (
        <>
          {Array.from({ length: 440 }, () => (
            <div class={clsx(backgroundColor, 'size-[0.2vh]', 'opacity-25')} />
          ))}
        </>
      );
    }

    const active = memory()!.active;
    const available = memory()!.available;
    const free = 440 - active - available;

    return (
      <>
        {Array.from({ length: free }, () => (
          <div class={clsx(backgroundColor, 'size-[0.2vh]', 'opacity-25')} />
        ))}
        {Array.from({ length: available }, () => (
          <div class={clsx(backgroundColor, 'size-[0.2vh]', 'opacity-50')} />
        ))}
        {Array.from({ length: active }, () => (
          <div class={clsx(backgroundColor, 'size-[0.2vh]', 'opacity-100')} />
        ))}
      </>
    );
  };

  const memoryText = () => {
    if (!memory()) {
      return '';
    }
    return `USING ${memory()?.used} OUT OF ${memory()?.total} GiB`;
  };

  return (
    <div class="w-full font-united_sans_light text-[1.111vh] tracking-[0.092vh] sm:px-0.5 md:px-1.5 lg:px-2.5 xl:px-3.5">
      <div class="flex flex-row flex-nowrap items-center justify-between">
        <span class="sm:text-xs md:text-base lg:text-2xl xl:text-4xl">
          MEMORY
        </span>
        <span class="opacity-50 sm:text-xxs md:text-sm lg:text-lg xl:text-2xl">
          {memoryText()}
        </span>
      </div>
      <div class="mb-[0.8vh] grid grid-flow-row grid-cols-[repeat(40,_1fr)] grid-rows-[repeat(11,_1fr)] gap-[0.23vh] pt-[0.5vh]">
        {memoryMap()}
      </div>
      <div class="mb-[0.5vh] grid grid-cols-[15%_65%_20%] items-center">
        <span class="m-0 self-center sm:text-xxs md:text-sm lg:text-lg xl:text-2xl">
          SWAP
        </span>
        <div
          class={clsx(
            theme().borderColor['80'],
            'flex h-3/4 w-full flex-col items-start justify-center border-r-[0.1vh] border-solid',
          )}
        >
          <div
            class={clsx(
              theme().backgroundColor.active,
              'relative h-[0.4vh] w-full opacity-60 duration-500 ease-in',
            )}
            style={{
              width: `${memory()?.ratio || 0}%`,
            }}
          />
          <div
            class={clsx(
              theme().backgroundColor.active,
              'relative h-[0.25vh] w-full self-center opacity-80',
            )}
          />
        </div>
        <span class="m-0 self-center whitespace-nowrap text-right not-italic opacity-50 sm:text-xxs md:text-sm lg:text-lg xl:text-2xl">
          {memory()?.swap || '0.0'} GiB
        </span>
      </div>
    </div>
  );
}

export default MemInfo;
