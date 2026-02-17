import { createSignal, Index, Match, Switch } from 'solid-js';
import { cn } from '@/lib/utils';

interface TerminalSelectionTabProps {
	active: () => string;
	terminalIds: () => string[];
	switchTab: (id: string) => void;
	addTerminal: VoidFunction;
}

function TerminalSelectionTab(props: TerminalSelectionTabProps) {
	const [editingId, setEditingId] = createSignal<string | null>(null);
	const [terminalNames, setTerminalNames] = createSignal<
		Record<string, string>
	>({});

	function handleRename(id: string, e: MouseEvent) {
		e.stopPropagation();
		setEditingId(id);
	}

	function handleBlur(id: string, e: FocusEvent) {
		const input = e.target as HTMLInputElement;
		try {
			setTerminalNames(prev => ({ ...prev, [id]: input.value }));
		} finally {
			setEditingId(null);
		}
	}

	function handleKeyDown(id: string, e: KeyboardEvent) {
		if (e.key === 'Enter') {
			const input = e.target as HTMLInputElement;
			setTerminalNames(prev => ({ ...prev, [id]: input.value }));
			setEditingId(null);
		} else if (e.key === 'Escape') {
			setEditingId(null);
		}
	}

	function getName(id: string, index: number) {
		return terminalNames()[id] || `#${index}`;
	}

	return (
		<div class="border-default/75 font-united_sans_medium flex w-full flex-row flex-nowrap items-center overflow-hidden border-b-2 p-0 z-[-999]">
			<div class="no-scrollbar flex w-[95%] appearance-none flex-row items-start overflow-x-scroll overflow-y-hidden z-[inherit]">
				<Index each={props.terminalIds()}>
					{(id, index) => (
						<div
							class={cn(
								'bg-active text-main w-full max-w-[15%] min-w-[10%] skew-tab cursor-pointer overflow-hidden text-center -ml-1.5 text-base',
								props.active() === id() && 'text-active scale-125 font-medium',
							)}
							style={{
								'z-index': index * -1,
							}}
							onMouseDown={() => props.switchTab(id())}
						>
							<div
								class={cn(
									'bg-main w-full h-full skew-tab-inner flex flex-row justify-center items-center p-2',
									props.active() === id() && 'bg-active',
								)}
							>
								<Switch
									fallback={
										<>
											<span class="truncate text-center w-[68%]">
												{getName(id(), index)}
											</span>
											<button
												type="button"
												class="opacity-25 hover:opacity-100 shrink-0 rounded-full cursor-pointer"
												onMouseDown={e => handleRename(id(), e)}
											>
												<svg
													class="size-3.5 fill-current"
													viewBox="0 0 512 512"
												>
													<path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.2 5.8 24.7s16.1 8.7 24.7 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z" />
												</svg>
											</button>
										</>
									}
								>
									<Match when={editingId() === id()}>
										<input
											type="text"
											value={terminalNames()[id()] || ''}
											placeholder={`#${index}`}
											onBlur={e => handleBlur(id(), e)}
											onKeyDown={e => handleKeyDown(id(), e)}
											onMouseDown={e => e.stopPropagation()}
											class="bg-transparent border-none outline-none text-center flex-1 text-inherit"
											autofocus
										/>
									</Match>
								</Switch>
							</div>
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
