import type { ITerminalOptions } from '@xterm/xterm';
import { selectStyle, type Theme } from '@/lib/themes/styles';

function parseHex(hex: string): [number, number, number] {
	const h = hex.replace('#', '');
	return [
		Number.parseInt(h.slice(0, 2), 16),
		Number.parseInt(h.slice(2, 4), 16),
		Number.parseInt(h.slice(4, 6), 16),
	];
}

function toHex(r: number, g: number, b: number): string {
	const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
	return `#${[clamp(r), clamp(g), clamp(b)]
		.map(v => v.toString(16).padStart(2, '0'))
		.join('')
		.toUpperCase()}`;
}

function colorify(color: string, theme: string) {
	const [r, g, b] = parseHex(color);
	// Grayscale using ITU-R BT.601 weights
	const gray = r * 0.3 + g * 0.59 + b * 0.11;
	// Mix with theme color at weight 0.3 (same as Sass mix)
	const [tr, tg, tb] = parseHex(theme);
	const w1 = 0.3;
	const w2 = 0.7;
	return toHex(w1 * tr + w2 * gray, w1 * tg + w2 * gray, w1 * tb + w2 * gray);
}

export default function generateTerminalTheme(theme: Theme): ITerminalOptions {
	const style = selectStyle(theme);
	return {
		allowProposedApi: true,
		cursorBlink: true,
		cursorStyle: style.terminal.cursorStyle,
		allowTransparency: false,
		fontFamily: `"${style.terminal.fontFamily}", monospace`,
		fontWeight: 'normal',
		fontWeightBold: 'bold',
		letterSpacing: 0,
		lineHeight: 1,
		scrollback: 10e6,
		theme: {
			foreground: style.terminal.foreground,
			background: style.terminal.background,
			cursor: style.terminal.cursor,
			cursorAccent: style.terminal.cursorAccent,
			black: style.colors.black || colorify('#2e3436', style.colors.main),
			red: style.colors.red || colorify('#cc0000', style.colors.main),
			green: style.colors.green || colorify('#4e9a06', style.colors.main),
			yellow: style.colors.yellow || colorify('#c4a000', style.colors.main),
			blue: style.colors.blue || colorify('#3465a4', style.colors.main),
			magenta: style.colors.magenta || colorify('#75507b', style.colors.main),
			cyan: style.colors.cyan || colorify('#06989a', style.colors.main),
			white: style.colors.white || colorify('#d3d7cf', style.colors.main),
			brightBlack:
				style.colors.brightBlack || colorify('#555753', style.colors.main),
			brightRed:
				style.colors.brightRed || colorify('#ef2929', style.colors.main),
			brightGreen:
				style.colors.brightGreen || colorify('#8ae234', style.colors.main),
			brightYellow:
				style.colors.brightYellow || colorify('#fce94f', style.colors.main),
			brightBlue:
				style.colors.brightBlue || colorify('#729fcf', style.colors.main),
			brightMagenta:
				style.colors.brightMagenta || colorify('#ad7fa8', style.colors.main),
			brightCyan:
				style.colors.brightCyan || colorify('#34e2e2', style.colors.main),
			brightWhite:
				style.colors.brightWhite || colorify('#eeeeec', style.colors.main),
		},
	};
}
