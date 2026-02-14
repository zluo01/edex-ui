import type { Resource } from 'solid-js';
import { cn } from '@/lib/utils';

interface ShowHiddenFileSettingProps {
	showHidden: Resource<boolean>;
	changeHidden: () => void;
}

function ShowHiddenFileSetting(props: ShowHiddenFileSettingProps) {
	return (
		<div class="flex flex-row flex-nowrap items-center justify-between py-1">
			<span class="text-main sm:text-base md:text-xl lg:text-3xl xl:text-5xl">
				Show Hidden File
			</span>

			<label class="inline-flex cursor-pointer items-center">
				<input
					type="checkbox"
					class="peer sr-only"
					disabled={props.showHidden() === undefined}
					checked={props.showHidden()}
					onChange={() => props.changeHidden()}
				/>
				<div
					class={cn(
						'bg-secondary peer relative h-6 w-11 rounded-full',
						'after:absolute after:start-[2px] after:top-[2px] after:size-5 after:rounded-full',
						"after:border after:border-gray-300 after:bg-white after:transition-all after:content-['']",
						'peer-checked:opacity-75 peer-focus:outline-hidden peer-checked:after:translate-x-full peer-checked:after:border-white',
					)}
				/>
			</label>
		</div>
	);
}

export default ShowHiddenFileSetting;
