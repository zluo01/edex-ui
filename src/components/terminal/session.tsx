import { type Event, listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { Terminal } from '@xterm/xterm';
import { errorLog, traceLog } from '@/lib/log';
import {
	initializeSession,
	resizeSession,
	updateCurrentSession,
	writeToSession,
} from '@/lib/os';
import { type Addons, createTerminal } from '@/lib/terminal';
import { useTheme } from '@/lib/themes';
import generateTerminalTheme from '@/lib/themes/terminal';
import { cn } from '@/lib/utils';
import type { TerminalProps } from '@/models';
import '@xterm/xterm/css/xterm.css';
import {
	type Accessor,
	createEffect,
	createSignal,
	on,
	onCleanup,
	onMount,
} from 'solid-js';

function gcd(a: number, b: number): number {
	return b === 0 ? a : gcd(b, a % b);
}

async function resize(id: string, term: Terminal, addons: Addons) {
	const fitAddon = addons.fit;
	const dimensions = fitAddon.proposeDimensions();
	if (!dimensions) {
		await errorLog('Fail to get propose dimensions');
		return;
	}
	let { cols, rows } = dimensions;

	// Apply custom fixes based on screen ratio, see #302
	const w = screen.width;
	const h = screen.height;
	let x = 1;
	let y = 0;

	const d = gcd(w, h);

	if (d === 100) {
		y = 1;
		x = 3;
	}

	if (d === 256) {
		x = 2;
	}

	cols = cols + x;
	rows = rows + y;

	if (term.cols !== cols || term.rows !== rows) {
		term.resize(cols, rows);
		fitAddon.fit();
		await resizeSession(id, term.rows, term.cols);
	}
}

function useScreenWidth(): Accessor<number> {
	const [screenWidth, setScreenWidth] = createSignal(window.innerWidth);

	const controller = new AbortController();

	window.addEventListener(
		'resize',
		() => {
			setScreenWidth(window.innerWidth);
		},
		{
			signal: controller.signal,
		},
	);

	onCleanup(() => controller.abort());

	return screenWidth;
}

interface SessionProps {
	id: string;
	active: Accessor<string>;
}

function Session({ id, active }: SessionProps) {
	const { theme } = useTheme();

	// fontSize
	const screenWidth = useScreenWidth();
	const fontSize = () => {
		if (screenWidth() < 1920) {
			return 12;
		} else if (screenWidth() < 2560) {
			return 14;
		} else if (screenWidth() < 3840) {
			return 16;
		}
		return 20;
	};

	let terminalEl: HTMLDivElement | undefined;
	let terminal: TerminalProps | undefined;

	async function resizeTerminal(id: string) {
		if (terminal) {
			await resize(id, terminal.term, terminal.addons);
		}
	}

	onMount(async () => {
		const controller = new AbortController();
		let unListen: UnlistenFn | undefined;

		onCleanup(() => {
			terminal?.term.dispose();
			unListen?.();
			controller.abort();
		});

		try {
			await traceLog(`Initialize terminal interface. Id: ${id}`);
			if (!terminalEl) {
				await errorLog(
					'terminalEl is undefined in onMount, this should not happen',
				);
				return;
			}
			terminal = await createTerminal(terminalEl, theme(), fontSize());

			// Register the PTY output listener BEFORE spawning the shell so that
			// no early output (login banner, first prompt) can be emitted before
			// we are subscribed. Tauri does not queue events for pending listeners.
			unListen = await listen(`data-${id}`, (e: Event<string>) =>
				terminal?.term.write(e.payload),
			);

			await initializeSession(id);

			await resize(id, terminal.term, terminal.addons);

			terminal.term.onData(v => writeToSession(id, v));

			addEventListener('resize', () => resizeTerminal(id), {
				signal: controller.signal,
			});

			terminal.term.focus();
		} catch (e) {
			await errorLog(e);
		}
	});

	// refocus on tab change
	createEffect(
		on(
			active,
			async active => {
				try {
					if (active === id) {
						await resizeTerminal(id);
						terminal?.term.focus();
						await updateCurrentSession(id);
					} else {
						terminal?.term.blur();
					}
				} catch (e) {
					await errorLog(e);
				}
			},
			{ defer: true },
		),
	);

	// sync terminal theme
	createEffect(
		on(
			theme,
			async theme => {
				if (terminal?.term) {
					terminal.term.options = { ...generateTerminalTheme(theme) };
				}
			},
			{ defer: true },
		),
	);

	// sync terminal font size
	createEffect(
		on(
			fontSize,
			async fontSize => {
				if (terminal?.term) {
					terminal.term.options.fontSize = fontSize;
				}
			},
			{ defer: true },
		),
	);

	return (
		<div class={cn(active() !== id && 'hidden', 'size-full p-2')}>
			<div class="size-full" ref={el => (terminalEl = el)} />
		</div>
	);
}

export default Session;
