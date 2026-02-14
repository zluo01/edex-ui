import { ClipboardAddon } from '@xterm/addon-clipboard';
import { FitAddon } from '@xterm/addon-fit';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { WebglAddon } from '@xterm/addon-webgl';
import {
	type ITerminalInitOnlyOptions,
	Terminal,
	type Terminal as TerminalType,
} from '@xterm/xterm';
import { warnLog } from '@/lib/log';
import type { Theme } from '@/lib/themes';
import generateTerminalTheme from '@/lib/themes/terminal';
import type { ITerminalProps } from '@/models';

export type Addons = ReturnType<typeof getAddons>;

const OVERRIDE_KEY_MAP = [
	{ key: 'Tab', ctrlKey: true },
	{ key: 'W', ctrlKey: true },
	{ key: 'T', ctrlKey: true },
];

const INITIAL_DEFAULT_OPTIONS: ITerminalInitOnlyOptions = {
	cols: 80,
	rows: 24,
};

export async function createTerminal(
	terminalContainer: HTMLDivElement,
	theme: Theme,
	initialFontSize: number,
): Promise<ITerminalProps> {
	const term = new Terminal({
		fontSize: initialFontSize,
		...INITIAL_DEFAULT_OPTIONS,
		...generateTerminalTheme(theme),
	});

	const typedTerm = term as TerminalType;

	const addons = getAddons();
	Object.values(addons).forEach(addon => typedTerm.loadAddon(addon));

	term.open(terminalContainer);

	try {
		const webglAddon = new WebglAddon();
		typedTerm.loadAddon(webglAddon);
	} catch (e) {
		await warnLog(`WebGL not supported, falling back to canvas. Error: ${e}`);
	}

	term.focus();
	addons.fit.fit();

	setTimeout(() => {
		initAddons(term, addons);
		overrideKeyEvent(term);
	}, 0);

	return { term, addons };
}

function getAddons() {
	return {
		fit: new FitAddon(),
		unicode11: new Unicode11Addon(),
		clipboard: new ClipboardAddon(),
		webLink: new WebLinksAddon(),
	};
}

function initAddons(term: Terminal, _addons: Addons): void {
	term.unicode.activeVersion = '11';
}

function overrideKeyEvent(term: Terminal) {
	term.attachCustomKeyEventHandler(e => {
		if (e.type === 'keydown') {
			const isMac = e.metaKey && !e.ctrlKey && !e.shiftKey;
			const isLinux = e.ctrlKey && e.shiftKey;

			// copy
			if ((isMac || isLinux) && e.code === 'KeyC') {
				e.preventDefault();
				const selection = term.getSelection();
				if (selection) {
					navigator.clipboard.writeText(selection);
				}
				return false;
			}

			// paste
			// https://github.com/xtermjs/xterm.js/issues/2478#issuecomment-2325204572
			if ((isMac || isLinux) && e.code === 'KeyV') {
				return false;
			}

			for (const i in OVERRIDE_KEY_MAP) {
				if (
					OVERRIDE_KEY_MAP[i].key.toLowerCase() === e.key.toLowerCase() &&
					OVERRIDE_KEY_MAP[i].ctrlKey === e.ctrlKey
				) {
					return false;
				}
			}
		}
		return true;
	});
}
