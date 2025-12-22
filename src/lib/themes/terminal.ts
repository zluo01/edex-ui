import { selectStyle, Theme } from '@/lib/themes/styles';
import { ITerminalOptions } from '@xterm/xterm';
import Color from 'color';

function colorify(color: string, theme: string) {
  return Color(color).grayscale().mix(Color(theme), 0.3).hex();
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
