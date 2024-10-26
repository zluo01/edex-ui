import { IStyle } from '@/models';

const TRON: IStyle = {
  colors: {
    main: 'rgb(170, 207, 209)',
    black: '#000000',
    grey: '#262828',
  },
  terminal: {
    fontFamily: 'Fira Mono',
    cursorStyle: 'block',
    foreground: '#aacfd1',
    background: '#05080d',
    cursor: '#aacfd1',
    cursorAccent: '#aacfd1',
  },
};

const APOLLO: IStyle = {
  colors: {
    main: 'rgb(235, 235, 235)',
    black: '#000000',
    grey: '#262827',
  },
  terminal: {
    fontFamily: 'Fira Mono',
    cursorStyle: 'block',
    foreground: '#ebebeb',
    background: '#191919',
    cursor: '#ebebeb',
    cursorAccent: '#ebebeb',
  },
};

const BLADE: IStyle = {
  colors: {
    main: 'rgb(204, 94, 55)',
    black: '#000000',
    grey: '#262827',
  },
  terminal: {
    fontFamily: 'Fira Mono',
    cursorStyle: 'underline',
    foreground: '#cc5e37',
    background: '#090B0A',
    cursor: '#cc5e37',
    cursorAccent: '#cc5e37',
  },
};

const CYBORG: IStyle = {
  colors: {
    main: 'rgb(95, 215, 215)',
    black: '#011f1f',
    grey: '#034747',
    red: '#ad3e5a',
    green: '#3cd66f',
    yellow: '#c5d63c',
    blue: '#3c4dd6',
    magenta: '#ad31ad',
    cyan: '#31adad',
    white: '#a3c2c2',
    brightBlack: '#454585',
    brightRed: '#eb0954',
    brightGreen: '#85ff5c',
    brightYellow: '#ffff5c',
    brightBlue: '#5c5cff',
    brightMagenta: '#ff47d6',
    brightCyan: '#5cffff',
    brightWhite: '#e6fafa',
  },
  terminal: {
    fontFamily: 'Fira Code',
    cursorStyle: 'block',
    foreground: '#a3c2c2',
    background: '#0a3333',
    cursor: '#5cffff',
    cursorAccent: '#85ff5c',
  },
};

const INTERSTELLAR: IStyle = {
  colors: {
    main: 'rgb(3, 169, 244)',
    black: '#f3f3f3',
    grey: '#bfbfbf',
  },
  terminal: {
    fontFamily: 'Fira Mono',
    cursorStyle: 'bar',
    foreground: '#03A9F4',
    background: '#dedede',
    cursor: '#03A9F4',
    cursorAccent: '#03A9F4',
  },
};

export function selectStyle(theme: Theme) {
  switch (theme) {
    case Theme.TRON:
      return TRON;
    case Theme.APOLLO:
      return APOLLO;
    case Theme.CYBORG:
      return CYBORG;
    case Theme.BLADE:
      return BLADE;
    case Theme.INTERSTELLAR:
      return INTERSTELLAR;
  }
}

export enum Theme {
  TRON = 'TRON',
  APOLLO = 'APOLLO',
  BLADE = 'BLADE',
  CYBORG = 'CYBORG',
  INTERSTELLAR = 'INTERSTELLAR',
}
