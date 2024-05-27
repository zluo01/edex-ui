import TableRows from '@/components/dashboard/rows';
import { IStyle } from '@/models';
import clsx from 'clsx';
import { InitializedResource } from 'solid-js';

interface IActiveProcessTableProps {
  theme: InitializedResource<IStyle>;
}

function ActiveProcessTable({ theme }: IActiveProcessTableProps) {
  const headerStyle = clsx(
    theme().borderColor['75'],
    'border-r-[0.1vh] border-solid pl-1 font-bold opacity-60 sm:text-xs md:text-base lg:text-xl xl:text-3xl',
  );

  return (
    <div class="h-[90%] w-full">
      <div
        class={clsx(
          theme().borderColor['75'],
          theme().backgroundColor.secondary,
          'flex h-fit w-full flex-row flex-nowrap items-center border-[0.1vh] border-solid',
        )}
      >
        <span class={clsx(headerStyle, 'w-[10%]')}>PID</span>
        <span class={clsx(headerStyle, 'w-1/4')}>Name</span>
        <span class={clsx(headerStyle, 'w-[11%]')}>CPU</span>
        <span class={clsx(headerStyle, 'w-[11%]')}>Memory</span>
        <span class={clsx(headerStyle, 'w-[12%]')}>State</span>
        <span class={clsx(headerStyle, 'w-[19%]')}>Started</span>
        <span class={clsx(headerStyle, 'w-[12%]')}>Runtime</span>
      </div>
      <div class="no-scrollbar flex h-[95%] w-full appearance-none flex-col overflow-auto">
        <TableRows theme={theme} />
      </div>
    </div>
  );
}

export default ActiveProcessTable;
