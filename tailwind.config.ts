import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/frontend/**/*.{ts,tsx,js,jsx}',
    './app/views/**/*.{erb,haml,html,slim}',
    './app/helpers/**/*.{rb}',
  ],
  theme: {
    extend: {},
  },
  darkMode: ['class', "[data-theme='dark']"],
} satisfies Config;
