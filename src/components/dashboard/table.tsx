import TableRows from '@/components/dashboard/rows';
import { IStyle } from '@/models';
import clsx from 'clsx';
import { InitializedResource } from 'solid-js';

interface IActiveProcessTableProps {
  theme: InitializedResource<IStyle>;
}

function ActiveProcessTable(props: IActiveProcessTableProps) {
  const baseStyle =
    'border-r-[0.1vh] border-solid pl-1 font-bold opacity-60 sm:text-xxs md:text-sm lg:text-lg xl:text-2xl';

  return (
    <div class="h-[90%] w-full">
      <div
        class={clsx(
          props.theme().borderColor['75'],
          props.theme().backgroundColor.secondary,
          'grid h-fit w-full grid-cols-[10%_27%_8%_10%_12%_21%_12%] items-center border-[0.1vh] border-solid',
        )}
      >
        <span class={clsx(props.theme().borderColor['75'], baseStyle)}>
          PID
        </span>
        <span class={clsx(props.theme().borderColor['75'], baseStyle)}>
          Name
        </span>
        <span class={clsx(props.theme().borderColor['75'], baseStyle)}>
          CPU
        </span>
        <span class={clsx(props.theme().borderColor['75'], baseStyle)}>
          Memory
        </span>
        <span class={clsx(props.theme().borderColor['75'], baseStyle)}>
          State
        </span>
        <span class={clsx(props.theme().borderColor['75'], baseStyle)}>
          Started
        </span>
        <span class={clsx(props.theme().borderColor['75'], baseStyle)}>
          Runtime
        </span>
      </div>
      <div class="no-scrollbar flex h-[95%] w-full appearance-none flex-col overflow-auto">
        <TableRows theme={props.theme} />
      </div>
    </div>
  );
}

export default ActiveProcessTable;
