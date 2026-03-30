import { lazy } from 'solid-js';
import ProcessTable from '@/components/system/process/table';
import { openModal } from '@/lib/utils';

const ActiveProcess = lazy(() => import('@/components/dashboard'));

function Process() {
	return (
		<>
			<div
				class="font-united_sans_light flex h-[16vh] w-full flex-col flex-nowrap justify-between tracking-[0.092vh] hover:cursor-pointer sm:px-0.5 md:px-1.5 lg:px-2.5 xl:px-3.5"
				onMouseDown={() => openModal('active-process-modal')}
			>
				<div class="flex flex-row flex-nowrap items-center justify-between">
					<span class="sm:text-xs md:text-base lg:text-xl xl:text-3xl">
						TOP PROCESSES
					</span>
					<span class="sm:text-xxxs opacity-50 md:text-xs lg:text-base xl:text-xl">
						PID | NAME | CPU | MEM
					</span>
				</div>
				<div class="overflow-hidden">
					<ProcessTable />
				</div>
			</div>
			<ActiveProcess />
		</>
	);
}

export default Process;
