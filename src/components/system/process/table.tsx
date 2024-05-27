import { IProcessInformation } from '@/models';
import { Event, listen } from '@tauri-apps/api/event';
import { createSignal, For, onCleanup } from 'solid-js';

function ProcessTable() {
  const [processes, setProcesses] = createSignal<IProcessInformation[]>();

  const unListen = listen('process_short', (e: Event<IProcessInformation[]>) =>
    setProcesses(e.payload),
  );

  onCleanup(() => {
    unListen.then(f => f()).catch(e => console.error(e));
  });

  return (
    <table class="w-full table-auto hover:cursor-pointer hover:opacity-75">
      <tbody>
        <For each={processes()}>
          {process => (
            <tr>
              <td class="sm:text-xs md:text-base lg:text-xl xl:text-3xl">
                {process.pid}
              </td>
              <td class="max-w-[7vw] truncate font-bold sm:text-xs md:text-base lg:text-xl xl:text-3xl">
                {process.name}
              </td>
              <td class="text-right sm:text-xs md:text-base lg:text-xl xl:text-3xl">
                {process.cpu_usage}%
              </td>
              <td class="text-right sm:text-xs md:text-base lg:text-xl xl:text-3xl">
                {process.memory_usage}%
              </td>
            </tr>
          )}
        </For>
      </tbody>
    </table>
  );
}

export default ProcessTable;
