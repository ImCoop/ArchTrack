import type { Config } from 'tailwindcss';

export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#172033',
        steel: '#44546f',
        field: '#f4f7fb',
        line: '#d8e0ec',
        action: '#0f766e',
      },
    },
  },
  plugins: [],
} satisfies Config;
