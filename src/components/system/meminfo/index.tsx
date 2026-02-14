import { type Event, listen } from '@tauri-apps/api/event';
import prettyBytes from 'pretty-bytes';
import { createSignal, onCleanup } from 'solid-js';
import { errorLog } from '@/lib/log';
import type { IGPUData, IMemoryInformation, SystemData } from '@/models';

interface IMemLoad {
	cpuMemory: IMemoryInformation;
	gpu: IGPUData;
}

function MemInfo() {
	const [memory, setMemory] = createSignal<IMemLoad>();

	const unListen = listen('system', (e: Event<SystemData>) =>
		setMemory({
			cpuMemory: e.payload.memory,
			gpu: e.payload.gpu,
		}),
	);

	onCleanup(() => {
		unListen.then(f => f()).catch(errorLog);
	});

	const memoryMap = () => {
		if (!memory()) {
			return (
				<>
					{Array.from({ length: 440 }, () => (
						<div class="bg-active size-[0.2vh] opacity-25" />
					))}
				</>
			);
		}

		const active = memory()!.cpuMemory.active;
		const available = memory()!.cpuMemory.available;
		const free = 440 - active - available;

		return (
			<>
				{Array.from({ length: free }, () => (
					<div class="bg-active size-[0.2vh] opacity-25" />
				))}
				{Array.from({ length: available }, () => (
					<div class="bg-active size-[0.2vh] opacity-50" />
				))}
				{Array.from({ length: active }, () => (
					<div class="bg-active size-[0.2vh] opacity-100" />
				))}
			</>
		);
	};

	const cpuMemoryText = () => {
		if (!memory()) {
			return '';
		}
		return `USING ${prettyBytes(memory()!.cpuMemory.used)} OUT OF ${prettyBytes(memory()!.cpuMemory.total)}`;
	};

	const gpuMemoryText = () => {
		if (!memory()) {
			return '';
		}
		return `USING ${prettyBytes(memory()!.gpu.usedMemory)} OUT OF ${prettyBytes(memory()!.gpu.totalMemory)}`;
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
				{memoryMap()}
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
