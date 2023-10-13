import ProcessTable from '@/components/system/process/table';
import { Fragment, lazy, Suspense, useState } from 'react';

const ActiveProcess = lazy(() => import('@/components/dashboard'));

function Process() {
  const [open, setOpen] = useState(false);

  return (
    <Fragment>
      <div
        className="flex h-[16vh] w-full flex-col flex-nowrap justify-between font-united_sans_light tracking-[0.092vh] hover:cursor-pointer sm:px-0.5 md:px-1.5 lg:px-2.5 xl:px-3.5"
        onClick={() => setOpen(true)}
      >
        <div className="flex flex-row flex-nowrap items-center justify-between">
          <span className="sm:text-xs md:text-base lg:text-xl xl:text-3xl">
            TOP PROCESSES
          </span>
          <span className="opacity-50 sm:text-xxxs md:text-xs lg:text-base xl:text-xl">
            PID | NAME | CPU | MEM
          </span>
        </div>
        <div className="overflow-hidden">
          <ProcessTable />
        </div>
      </div>
      <Suspense>
        <ActiveProcess close={() => setOpen(false)} open={open} />
      </Suspense>
    </Fragment>
  );
}

export default Process;
