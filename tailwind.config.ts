import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    screens: {
      sm: '1280px',
      md: '1920px',
      lg: '2560px',
      xl: '3840px',
    },
    extend: {
      fontSize: {
        xxxs: ['8px', '8px'],
        xxs: ['10px', '12px'],
      },
      fontFamily: {
        united_sans_light: ['united-sans-light'],
        united_sans_medium: ['united-sans-medium'],
        fira_code: ['fira-code'],
        fira_mono: ['fira-mono'],
      },
    },
  },
  plugins: [],
};
export default config;
