/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    screens: {
      sm: '1280px',
      md: '1920px',
      lg: '2560px',
      xl: '3840px',
    },
    backgroundColor: {
      main: 'rgb(var(--bg-main) / <alpha-value>)',
      secondary: 'rgb(var(--bg-secondary) / <alpha-value>)',
      active: 'rgb(var(--bg-active) / <alpha-value>)',
      hover: 'rgb(var(--bg-hover) / <alpha-value>)',
    },
    borderColor: {
      default: 'rgb(var(--border-default) / <alpha-value>)',
    },
    textColor: {
      main: 'rgb(var(--text-main) / <alpha-value>)',
      active: 'rgb(var(--text-active) / <alpha-value>)',
      hover: 'rgb(var(--text-hover) / <alpha-value>)',
    },
    extend: {
      fontSize: {
        xxxs: ['8px', '8px'],
        xxs: ['10px', '12px'],
      },
      fontFamily: {
        united_sans_light: ['united-sans-light'],
        united_sans_medium: ['united-sans-medium'],
      },
      animation: {
        fade: 'fadeOut 0.25s ease-in-out',
      },
      keyframes: {
        fadeOut: {
          '0%': { opacity: '0' },
          '100%': { opacity: '100' },
        },
      },
    },
  },
  plugins: [],
};
