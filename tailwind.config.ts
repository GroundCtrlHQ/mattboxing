import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        charcoal: '#0A0A0A',
        'boxing-red': '#DC2626',
        'champion-gold': '#F59E0B',
      },
    },
  },
  plugins: [],
};

export default config;
