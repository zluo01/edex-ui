import { errorLog } from '@/lib/log';
import { IProcessInformation, IStyle } from '@/models';
import { Event, listen } from '@tauri-apps/api/event';
import clsx from 'clsx';
import {
  createSignal,
  For,
  InitializedResource,
  JSX,
  onCleanup,
  Show,
} from 'solid-js';

interface ITableRowsProps {
  theme: InitializedResource<IStyle>;
}

function TableRows(props: ITableRowsProps): JSX.Element {
  const [processes, setProcesses] = createSignal<IProcessInformation[]>();
  const unListen = listen('process', (e: Event<IProcessInformation[]>) =>
    setProcesses(e.payload),
  );

  onCleanup(() => unListen.then(f => f()).catch(errorLog));

  const baseStyles =
    'truncate border-r-[0.1vh] border-solid pl-1 sm:text-xs md:text-base lg:text-xl xl:text-3xl';

  return (
    <Show when={processes()} fallback={<div />}>
      <For each={processes()}>
        {process => (
          <div
            class={clsx(
              props.theme().borderColor['75'],
              'grid size-full grid-cols-[10%_27%_8%_10%_12%_21%_12%] items-center border-[0.1vh] border-solid',
            )}
          >
            <span class={clsx(props.theme().borderColor['75'], baseStyles)}>
              {process.pid}
            </span>
            <span
              class={clsx(props.theme().borderColor['75'], baseStyles)}
              title={process.name}
            >
              {process.name}
            </span>
            <span class={clsx(props.theme().borderColor['75'], baseStyles)}>
              {process.cpu_usage}%
            </span>
            <span class={clsx(props.theme().borderColor['75'], baseStyles)}>
              {process.memory_usage}%
            </span>
            <span class={clsx(props.theme().borderColor['75'], baseStyles)}>
              {process.state}
            </span>
            <span class={clsx(props.theme().borderColor['75'], baseStyles)}>
              {process.start_time}
            </span>
            <span class={clsx(props.theme().borderColor['75'], baseStyles)}>
              {process.run_time}
            </span>
          </div>
        )}
      </For>
    </Show>
  );
}

export default TableRows;
