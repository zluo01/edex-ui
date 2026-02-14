import { type Event, listen } from '@tauri-apps/api/event';
import { createSignal, For, type JSX, onCleanup, Show } from 'solid-js';
import { errorLog } from '@/lib/log';
import type { IProcessInformation } from '@/models';

function TableRows(): JSX.Element {
	const [processes, setProcesses] = createSignal<IProcessInformation[]>();
	const unListen = listen('process', (e: Event<IProcessInformation[]>) =>
		setProcesses(e.payload),
	);

	onCleanup(() => unListen.then(f => f()).catch(errorLog));

	return (
		<Show when={processes()} fallback={<div />}>
			<For each={processes()}>
				{process => (
					<div class="border-default/75 grid size-full grid-cols-[10%_27%_8%_10%_12%_21%_12%] items-center border-[0.1vh] border-solid">
						<span class="border-default/75 truncate border-r-[0.1vh] border-solid pl-1 sm:text-xs md:text-base lg:text-xl xl:text-3xl">
							{process.pid}
						</span>
						<span
							class="border-default/75 truncate border-r-[0.1vh] border-solid pl-1 sm:text-xs md:text-base lg:text-xl xl:text-3xl"
							title={process.name}
						>
							{process.name}
						</span>
						<span class="border-default/75 truncate border-r-[0.1vh] border-solid pl-1 sm:text-xs md:text-base lg:text-xl xl:text-3xl">
							{process.cpu_usage}%
						</span>
						<span class="border-default/75 truncate border-r-[0.1vh] border-solid pl-1 sm:text-xs md:text-base lg:text-xl xl:text-3xl">
							{process.memory_usage}%
						</span>
						<span class="border-default/75 truncate border-r-[0.1vh] border-solid pl-1 sm:text-xs md:text-base lg:text-xl xl:text-3xl">
							{process.state}
						</span>
						<span class="border-default/75 truncate border-r-[0.1vh] border-solid pl-1 sm:text-xs md:text-base lg:text-xl xl:text-3xl">
							{process.start_time}
						</span>
						<span class="border-default/75 truncate border-r-[0.1vh] border-solid pl-1 sm:text-xs md:text-base lg:text-xl xl:text-3xl">
							{process.run_time}
						</span>
					</div>
				)}
			</For>
		</Show>
	);
}

export default TableRows;
