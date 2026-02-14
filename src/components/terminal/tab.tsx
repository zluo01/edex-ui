import { Index } from 'solid-js';
import { cn } from '@/lib/utils';
import type { TerminalContext } from '@/models';

interface TerminalSelectionTabProps {
	active: () => string;
	terminalIds: () => TerminalContext[];
	switchTab: (id: string) => void;
	addTerminal: VoidFunction;
}

function TerminalSelectionTab(props: TerminalSelectionTabProps) {
	return (
		<div class="border-default/75 font-united_sans_medium flex w-full flex-row flex-nowrap items-center overflow-hidden rounded-t-sm border-b-2 p-0">
			<div class="no-scrollbar flex w-[95%] appearance-none flex-row items-start overflow-x-scroll overflow-y-hidden">
				<Index each={props.terminalIds()}>
					{(context, index) => (
						<div
							id={context().name || `#${index}`}
							class={cn(
								'border-default/75 bg-main text-main w-full max-w-[15%] min-w-[10%] skew-x-35 cursor-pointer overflow-hidden border-r-2 border-solid py-2 text-center',
								props.active() === context().id &&
									'bg-active text-active scale-125 skew-x-35 font-medium',
							)}
							onMouseDown={() => props.switchTab(context().id)}
						>
							<p class="m-0 skew-x-[-35deg] sm:text-xs md:text-base lg:text-xl xl:text-3xl">
								{context().name || `#${index}`}
							</p>
						</div>
					)}
				</Index>
			</div>
			<div
				onMouseDown={() => props.addTerminal()}
				class="border-default/75 text-main hover:bg-hover hover:text-hover flex h-full w-[5%] skew-x-45 cursor-pointer items-center justify-center border-l border-solid font-normal sm:text-xs md:text-base lg:text-xl xl:text-3xl"
			>
				<svg
					class="size-6 skew-x-[-45deg] fill-current"
					height="1em"
					viewBox="0 0 448 512"
				>
					<path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" />
				</svg>
			</div>
		</div>
	);
}

export default TerminalSelectionTab;
