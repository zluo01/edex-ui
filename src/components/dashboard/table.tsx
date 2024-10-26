import TableRows from '@/components/dashboard/rows';

function ActiveProcessTable() {
  return (
    <div class="h-[90%] w-full">
      <div class="grid h-fit w-full grid-cols-[10%_27%_8%_10%_12%_21%_12%] items-center border-[0.1vh] border-solid border-default/75 bg-secondary">
        <span class="border-r-[0.1vh] border-solid border-default/75 pl-1 font-bold opacity-60 sm:text-xxs md:text-sm lg:text-lg xl:text-2xl">
          PID
        </span>
        <span class="border-r-[0.1vh] border-solid border-default/75 pl-1 font-bold opacity-60 sm:text-xxs md:text-sm lg:text-lg xl:text-2xl">
          Name
        </span>
        <span class="border-r-[0.1vh] border-solid border-default/75 pl-1 font-bold opacity-60 sm:text-xxs md:text-sm lg:text-lg xl:text-2xl">
          CPU
        </span>
        <span class="border-r-[0.1vh] border-solid border-default/75 pl-1 font-bold opacity-60 sm:text-xxs md:text-sm lg:text-lg xl:text-2xl">
          Memory
        </span>
        <span class="border-r-[0.1vh] border-solid border-default/75 pl-1 font-bold opacity-60 sm:text-xxs md:text-sm lg:text-lg xl:text-2xl">
          State
        </span>
        <span class="border-r-[0.1vh] border-solid border-default/75 pl-1 font-bold opacity-60 sm:text-xxs md:text-sm lg:text-lg xl:text-2xl">
          Started
        </span>
        <span class="border-r-[0.1vh] border-solid border-default/75 pl-1 font-bold opacity-60 sm:text-xxs md:text-sm lg:text-lg xl:text-2xl">
          Runtime
        </span>
      </div>
      <div class="no-scrollbar flex h-[95%] w-full appearance-none flex-col overflow-auto">
        <TableRows />
      </div>
    </div>
  );
}

export default ActiveProcessTable;
