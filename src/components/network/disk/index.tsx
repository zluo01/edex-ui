import { type Event, listen } from '@tauri-apps/api/event';
import isEqual from 'lodash-es/isEqual';
import prettyBytes from 'pretty-bytes';
import { createSignal, For, onCleanup } from 'solid-js';
import { errorLog } from '@/lib/log';
import type { DiskUsageStatus } from '@/models';

function DiskUsage() {
	const [disks, setDisks] = createSignal<DiskUsageStatus[]>();

	const unListen = listen('disk', (e: Event<DiskUsageStatus[]>) =>
		setDisks(prevState =>
			isEqual(prevState, e.payload) ? prevState : e.payload,
		),
	);

	onCleanup(() => {
		unListen.then(f => f()).catch(errorLog);
	});

	return (
		<div class="font-united_sans_light flex h-[28vh] w-full flex-col flex-nowrap tracking-[0.092vh] sm:px-0.5 md:px-1.5 lg:px-2.5 xl:px-3.5">
			<div class="flex flex-row flex-nowrap items-center justify-start">
				<span class="sm:text-xs md:text-base lg:text-xl xl:text-4xl">
					DISK USAGE
				</span>
			</div>
			<div class="mb-3 size-full overflow-auto">
				<For each={disks()}>
					{disk => (
						<div
							class="flex flex-col"
							style={{
								background: `linear-gradient(to right, var(--color-shade) ${disk.usage}%, transparent 80%)`,
							}}
						>
							<div class="flex flex-row items-center justify-between">
								<span class="sm:text-xs md:text-base lg:text-xl xl:text-4xl">
									{disk.name}
								</span>
								<span class="sm:text-xxs md:text-sm lg:text-lg xl:text-3xl">
									{disk.internal ? 'Internal' : 'External'}
								</span>
							</div>
							<div class="flex flex-row items-center justify-between">
								<span class="sm:text-xxxs md:text-xs lg:text-base xl:text-2xl">
									{prettyBytes(disk.total)}
								</span>
								<span class="sm:text-xxxs md:text-xs lg:text-base xl:text-2xl">
									{prettyBytes(disk.available)} Free
								</span>
							</div>
						</div>
					)}
				</For>
			</div>
		</div>
	);
}

export default DiskUsage;
