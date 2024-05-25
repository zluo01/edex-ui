import { IDiskUsage } from '@/models';
import { useCurrentTheme } from '@/themes';
import { Event, listen } from '@tauri-apps/api/event';
import isEqual from 'lodash/isEqual';
import prettyBytes from 'pretty-bytes';
import { createSignal, For, onCleanup } from 'solid-js';

function DiskUsage() {
  const theme = useCurrentTheme();

  const [disks, setDisks] = createSignal<IDiskUsage[]>();

  const unListen = listen('disk', (e: Event<IDiskUsage[]>) =>
    setDisks(prevState =>
      isEqual(prevState, e.payload) ? prevState : e.payload,
    ),
  );

  onCleanup(() => {
    unListen.then(f => f()).catch(e => console.error(e));
  });

  return (
    <div class="flex h-[28vh] w-full flex-col flex-nowrap font-united_sans_light tracking-[0.092vh] sm:px-0.5 md:px-1.5 lg:px-2.5 xl:px-3.5">
      <div class="flex flex-row flex-nowrap items-center justify-start">
        <span class="sm:text-xs md:text-base lg:text-xl xl:text-4xl">
          DISK USAGE
        </span>
      </div>
      <div class="size-full overflow-auto">
        <For each={disks()}>
          {disk => (
            <div
              class="flex flex-col"
              style={{
                background: `linear-gradient(to right, ${theme().colors.grey} ${disk.usage}%, transparent 80%)`,
              }}
            >
              <div class="flex flex-row items-center justify-between">
                <span class="sm:text-xs md:text-base lg:text-xl xl:text-4xl">
                  {disk.name}
                </span>
                <span class="sm:text-xxs md:text-sm  lg:text-lg xl:text-3xl">
                  {disk.internal ? 'Internal' : 'External'}
                </span>
              </div>
              <div class="flex flex-row items-center justify-between">
                <span class="sm:text-xxxs md:text-xs lg:text-base xl:text-2xl">
                  {prettyBytes(disk.total)}
                </span>
                <span class="sm:text-xxxs md:text-xs lg:text-base xl:text-2xl">
                  {prettyBytes(disk.available)} Free
                </span>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}

export default DiskUsage;
