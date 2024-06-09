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
    'border-r-[0.1vh] border-solid pl-1 font-bold opacity-60 sm:text-xxs md:text-sm lg:text-lg xl:text-2xl',
  );

  return (
    <div class="h-[90%] w-full">
      <div
        class={clsx(
          theme().borderColor['75'],
          theme().backgroundColor.secondary,
          'grid h-fit w-full grid-cols-[10%_27%_8%_10%_12%_21%_12%] items-center border-[0.1vh] border-solid',
        )}
      >
        <span class={headerStyle}>PID</span>
        <span class={headerStyle}>Name</span>
        <span class={headerStyle}>CPU</span>
        <span class={headerStyle}>Memory</span>
        <span class={headerStyle}>State</span>
        <span class={headerStyle}>Started</span>
        <span class={headerStyle}>Runtime</span>
      </div>
      <div class="no-scrollbar flex h-[95%] w-full appearance-none flex-col overflow-auto">
        <TableRows theme={theme} />
      </div>
    </div>
  );
}

export default ActiveProcessTable;
