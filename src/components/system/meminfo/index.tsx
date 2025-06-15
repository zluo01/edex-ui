import { errorLog } from '@/lib/log';
import { IMemoryInformation, SystemData } from '@/models';
import { Event, listen } from '@tauri-apps/api/event';
import { createSignal, onCleanup } from 'solid-js';

function MemInfo() {
  const [memory, setMemory] = createSignal<IMemoryInformation>();

  const unListen = listen('system', (e: Event<SystemData>) =>
    setMemory(e.payload.memory),
  );

  onCleanup(() => {
    unListen.then(f => f()).catch(errorLog);
  });

  const memoryMap = () => {
    if (!memory()) {
      return (
        <>
          {Array.from({ length: 440 }, () => (
            <div class="size-[0.2vh] bg-active opacity-25" />
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
          <div class="size-[0.2vh] bg-active opacity-25" />
        ))}
        {Array.from({ length: available }, () => (
          <div class="size-[0.2vh] bg-active opacity-50" />
        ))}
        {Array.from({ length: active }, () => (
          <div class="size-[0.2vh] bg-active opacity-100" />
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
        <div class="flex h-3/4 w-full flex-col items-start justify-center border-r-[0.1vh] border-solid border-default/80">
          <div
            class="relative h-[0.4vh] w-full bg-active opacity-60 duration-500 ease-in"
            style={{
              width: `${memory()?.ratio || 0}%`,
            }}
          />
          <div class="relative h-[0.25vh] w-full self-center bg-active opacity-80" />
        </div>
        <span class="m-0 self-center whitespace-nowrap text-right not-italic opacity-50 sm:text-xxs md:text-sm lg:text-lg xl:text-2xl">
          {memory()?.swap || '0.0'} GiB
        </span>
      </div>
    </div>
  );
}

export default MemInfo;
