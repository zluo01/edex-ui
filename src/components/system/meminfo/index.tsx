import { type Event, listen } from '@tauri-apps/api/event';
import prettyBytes from 'pretty-bytes';
import { createSignal, For, onCleanup } from 'solid-js';
import { errorLog } from '@/lib/log';
import { cn } from '@/lib/utils';
import type { GPUData, MemoryInformation, SystemData } from '@/models';

interface MemLoad {
	cpuMemory: MemoryInformation;
	gpu: GPUData;
}

const MEMORY_GRID_SIZE = 440;
const MEMORY_INDICES = Array.from({ length: MEMORY_GRID_SIZE }, (_, i) => i);

function MemInfo() {
	const [memory, setMemory] = createSignal<MemLoad>();

	const unListen = listen('system', (e: Event<SystemData>) =>
		setMemory({
			cpuMemory: e.payload.memory,
			gpu: e.payload.gpu,
		}),
	);

	onCleanup(() => {
		unListen.then(f => f()).catch(errorLog);
	});

	const getCellOpacityClass = (index: number) => {
		const mem = memory();
		if (!mem) return 'opacity-25';

		const active = mem.cpuMemory.active;
		const available = mem.cpuMemory.available;
		const availableStart = MEMORY_GRID_SIZE - active - available;
		const activeStart = MEMORY_GRID_SIZE - active;

		if (index >= activeStart) return 'opacity-100';
		if (index >= availableStart) return 'opacity-50';
		return 'opacity-25';
	};

	const cpuMemoryText = () => {
		const mem = memory();
		if (!mem) return '';
		return `USING ${prettyBytes(mem.cpuMemory.used)} OUT OF ${prettyBytes(mem.cpuMemory.total)}`;
	};

	const gpuMemoryText = () => {
		const mem = memory();
		if (!mem) return '';
		return `USING ${prettyBytes(mem.gpu.usedMemory)} OUT OF ${prettyBytes(mem.gpu.totalMemory)}`;
	};

	return (
		<div class="font-united_sans_light w-full text-[1.111vh] tracking-[0.092vh] sm:px-0.5 md:px-1.5 lg:px-2.5 xl:px-3.5">
			<div class="flex flex-row flex-nowrap items-center justify-between">
				<span class="sm:text-xs md:text-base lg:text-2xl xl:text-4xl">
					MEMORY
				</span>
				<span class="sm:text-xxxs md:text-xxs opacity-50 lg:text-sm xl:text-lg">
					{cpuMemoryText()}
				</span>
			</div>
			<div class="mb-[0.8vh] grid grid-flow-row grid-cols-[repeat(40,1fr)] grid-rows-[repeat(11,1fr)] gap-[0.23vh] pt-[0.5vh]">
				<For each={MEMORY_INDICES}>
					{index => (
						<div
							class={cn('bg-active size-[0.2vh]', getCellOpacityClass(index))}
						/>
					)}
				</For>
			</div>
			<div class="mb-[0.5vh] grid grid-cols-[15%_65%_20%] items-center">
				<span class="sm:text-xxs m-0 self-center md:text-sm lg:text-lg xl:text-2xl">
					SWAP
				</span>
				<div class="border-default/80 flex h-3/4 w-full flex-col items-start justify-center border-r-[0.1vh] border-solid px-1">
					<div
						class="bg-active relative h-[0.4vh] w-full opacity-60 duration-500 ease-in"
						style={{
							width: `${memory()?.cpuMemory?.ratio || 0}%`,
						}}
					/>
					<div class="bg-active relative h-[0.25vh] w-full self-center opacity-80" />
				</div>
				<span class="sm:text-xxxs md:text-xxs m-0 self-center text-right whitespace-nowrap not-italic opacity-50 lg:text-sm xl:text-lg">
					{prettyBytes(memory()?.cpuMemory?.swap || 0)}
				</span>
			</div>
			<div class="border-default/30 h-0 w-full border-y border-dashed" />
			<div class="flex flex-row flex-nowrap items-center justify-between">
				<span class="sm:text-xxs md:text-sm lg:text-lg xl:text-2xl">VRAM</span>
				<span class="sm:text-xxxs md:text-xxs opacity-50 lg:text-sm xl:text-lg">
					{gpuMemoryText()}
				</span>
			</div>
			<div class="mb-[0.5vh] grid grid-cols-[80%_20%] items-center">
				<div class="border-default/80 px1 flex h-3/4 w-full flex-col items-start justify-center border-r-[0.1vh] border-solid">
					<div
						class="bg-active relative h-[0.4vh] w-full opacity-60 duration-500 ease-in"
						style={{
							width: `${memory()?.gpu.memoryUsage || 0}%`,
						}}
					/>
					<div class="bg-active relative h-[0.25vh] w-full self-center opacity-80" />
				</div>
				<span class="sm:text-xxxs md:text-xxs m-0 self-center text-right whitespace-nowrap not-italic opacity-50 lg:text-sm xl:text-lg">
					{prettyBytes(memory()?.gpu?.usedMemory || 0)}
				</span>
			</div>
		</div>
	);
}

export default MemInfo;
