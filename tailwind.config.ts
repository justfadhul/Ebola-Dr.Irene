import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // IPC readiness category palette (used everywhere, no per-chart overrides)
        critical: '#c0392b', // red   — <= 50%
        atrisk: '#f39c12',   // yellow/amber — 51-79%
        ready: '#27ae60',    // green — >= 80%
      },
    },
  },
  plugins: [],
};

export default config;
