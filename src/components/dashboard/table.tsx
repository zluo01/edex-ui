import TableRows from '@/components/dashboard/rows';

function ActiveProcessTable() {
	return (
		<div class="h-[90%] w-full">
			<div class="border-default/75 bg-secondary grid h-fit w-full grid-cols-[10%_27%_8%_10%_12%_21%_12%] items-center border-[0.1vh] border-solid">
				<span class="border-default/75 sm:text-xxs border-r-[0.1vh] border-solid pl-1 font-bold opacity-60 md:text-sm lg:text-lg xl:text-2xl">
					PID
				</span>
				<span class="border-default/75 sm:text-xxs border-r-[0.1vh] border-solid pl-1 font-bold opacity-60 md:text-sm lg:text-lg xl:text-2xl">
					Name
				</span>
				<span class="border-default/75 sm:text-xxs border-r-[0.1vh] border-solid pl-1 font-bold opacity-60 md:text-sm lg:text-lg xl:text-2xl">
					CPU
				</span>
				<span class="border-default/75 sm:text-xxs border-r-[0.1vh] border-solid pl-1 font-bold opacity-60 md:text-sm lg:text-lg xl:text-2xl">
					Memory
				</span>
				<span class="border-default/75 sm:text-xxs border-r-[0.1vh] border-solid pl-1 font-bold opacity-60 md:text-sm lg:text-lg xl:text-2xl">
					State
				</span>
				<span class="border-default/75 sm:text-xxs border-r-[0.1vh] border-solid pl-1 font-bold opacity-60 md:text-sm lg:text-lg xl:text-2xl">
					Started
				</span>
				<span class="border-default/75 sm:text-xxs border-r-[0.1vh] border-solid pl-1 font-bold opacity-60 md:text-sm lg:text-lg xl:text-2xl">
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
