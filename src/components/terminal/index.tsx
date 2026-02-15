import { createShortcut } from '@solid-primitives/keyboard';
import { type Event, listen } from '@tauri-apps/api/event';
import {
	batch,
	createEffect,
	createSignal,
	For,
	on,
	onCleanup,
	onMount,
} from 'solid-js';
import Session from '@/components/terminal/session';
import TerminalSelectionTab from '@/components/terminal/tab';
import { errorLog } from '@/lib/log';
import { terminateSession } from '@/lib/os';
import { useTerminal } from '@/lib/terminal';
import type { TerminalContainer, TerminalContext } from '@/models';

import './index.css';

function nextActiveTerminal(target: string, keys: TerminalContext[]) {
	const ids = keys.map(o => o.id);
	const idx = ids.indexOf(target);
	return ids[(idx + 1) % ids.length] || ids[0];
}

function TerminalSection() {
	const { active, setActive } = useTerminal();

	const [terminals, setTerminals] = createSignal<
		Map<string, TerminalContainer>
	>(new Map());

	const terminalContexts = () =>
		[...terminals().values()].map(o => o as TerminalContext);

	onMount(() => {
		addTerminal();
	});

	createEffect(
		on(active, active => {
			const item = document.getElementById(`#${active}`);
			if (item) {
				item.scrollIntoView({ behavior: 'smooth', inline: 'center' });
			}
		}),
	);

	createShortcut(
		['Control', 'Tab'],
		() => {
			if (terminalContexts().length === 1) {
				return;
			}
			setActive(prevState => nextActiveTerminal(prevState, terminalContexts()));
		},
		{ preventDefault: true },
	);

	createShortcut(
		['Control', 'W'],
		() => terminateSession(active()).catch(errorLog),
		{ preventDefault: true },
	);

	createShortcut(['Control', 'T'], () => addTerminal(), {
		preventDefault: true,
	});

	const unListen = listen('destroy', async (e: Event<string>) => {
		const id = e.payload;
		const nextIndex = nextActiveTerminal(id, terminalContexts());
		batch(() => {
			setActive(nextIndex);
			setTerminals(prevState => {
				const newMap = new Map(prevState);
				newMap.delete(id);
				return newMap;
			});
		});
	});

	onCleanup(() => {
		unListen.then(f => f()).catch(errorLog);
	});

	/**
	 * Create new terminal node
	 * Internally, will create a new pty sessions in the backend
	 * it will also handle updating the current index on creation.
	 */
	function addTerminal() {
		const id = crypto.randomUUID();
		batch(() => {
			setActive(id);
			setTerminals(prevState => {
				const newMap = new Map(prevState);
				newMap.set(id, {
					id,
					terminal: () => <Session id={/* @once */ id} active={active} />,
				});
				return newMap;
			});
		});
	}

	async function switchTerminal(id: string) {
		setActive(id);
	}

	return (
		<section class="relative h-full w-[68vw] overflow-hidden pt-[2.5vh] sm:px-1 md:px-2 lg:px-3">
			<div
				class="shell augment-border flex size-full flex-col items-start justify-start"
				data-augmented-ui="bl-clip tr-clip border"
			>
				<TerminalSelectionTab
					addTerminal={addTerminal}
					active={active}
					terminalIds={terminalContexts}
					switchTab={switchTerminal}
				/>
				<div class="m-0 size-full overflow-hidden">
					<For each={[...terminals().values()]}>
						{({ terminal }) => terminal()}
					</For>
				</div>
			</div>
		</section>
	);
}

export default TerminalSection;
