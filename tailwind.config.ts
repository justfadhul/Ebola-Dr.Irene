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
        // Attio-inspired neutral + accent surface tokens
        canvas: '#f6f7f9',
        surface: '#ffffff',
        hairline: '#e9e9ee',
        ink: '#1a1a20',
        subtle: '#6b6b76',
        accent: {
          DEFAULT: '#3b5bff',
          hover: '#2c49ee',
          soft: '#eef1ff',
        },
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.04)',
        pop: '0 8px 24px rgba(16, 24, 40, 0.10)',
      },
    },
  },
  plugins: [],
};

export default config;
