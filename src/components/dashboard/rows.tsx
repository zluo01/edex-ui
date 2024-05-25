import { IProcessInformation, IStyle } from '@/models';
import { Event, listen } from '@tauri-apps/api/event';
import clsx from 'clsx';
import {
  createSignal,
  For,
  InitializedResource,
  JSX,
  onCleanup,
} from 'solid-js';

interface ITableRowsProps {
  theme: InitializedResource<IStyle>;
}

function TableRows({ theme }: ITableRowsProps): JSX.Element {
  const [processes, setProcesses] = createSignal<IProcessInformation[]>();
  const unListen = listen('process', (e: Event<IProcessInformation[]>) =>
    setProcesses(e.payload),
  );

  onCleanup(() => unListen.then(f => f()).catch(e => console.error(e)));

  function epochTimeToActualDate(epochTime: number): string {
    const date = new Date(0); // The 0 represents the epoch date
    date.setUTCSeconds(epochTime);
    return date.toDateString();
  }

  const styles = clsx(
    theme().borderColor['75'],
    'truncate border-r-[0.1vh] border-solid pl-1 sm:text-xs md:text-base lg:text-xl xl:text-3xl',
  );

  if (!processes) {
    return <div />;
  }
  return (
    <For each={processes()}>
      {process => (
        <div
          class={clsx(
            theme().borderColor['75'],
            'flex size-full flex-row flex-nowrap items-center border-[0.1vh] border-solid',
          )}
        >
          <span class={clsx(styles, 'w-[10%]')}>{process.pid}</span>
          <span class={clsx(styles, 'w-[23%]')} title={process.name}>
            {process.name}
          </span>
          <span class={clsx(styles, 'w-[9%]')}>
            {Math.round(process.cpu_usage * 10) / 10}%
          </span>
          <span class={clsx(styles, 'w-[9%]')}>
            {Math.round(process.memory_usage * 10) / 10}%
          </span>
          <span class={clsx(styles, 'w-[6%]')}>{process.uid}</span>
          <span class={clsx(styles, 'w-[12%]')}>{process.state}</span>
          <span class={clsx(styles, 'w-[19%]')}>
            {epochTimeToActualDate(process.start_time)}
          </span>
          <span class={clsx(styles, 'w-[12%]')}>{process.run_time}</span>
        </div>
      )}
    </For>
  );
}

export default TableRows;
