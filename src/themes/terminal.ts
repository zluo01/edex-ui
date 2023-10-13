import { IStyle } from '@/models';
import Color from 'color';
import join from 'lodash/join';
import { ITerminalInitOnlyOptions, ITerminalOptions } from 'xterm';

function colorify(color: string, theme: string) {
  return Color(color).grayscale().mix(Color(theme), 0.3).hex();
}

const FALL_BACK_FONTS = ['Ubuntu Mono', 'Courier New'];
export default function generateTerminalTheme(
  style: IStyle,
): ITerminalOptions | ITerminalInitOnlyOptions {
  return {
    cols: 80,
    rows: 24,
    allowProposedApi: true,
    cursorBlink: true,
    cursorStyle: style.terminal.cursorStyle,
    allowTransparency: false,
    fontFamily: join([style.terminal.fontFamily, ...FALL_BACK_FONTS], ', '),
    fontSize: 15,
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
