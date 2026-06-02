import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['IBM Plex Mono', 'monospace'],
        sans: ['Cabinet Grotesk', 'DM Sans', 'sans-serif'],
      },
      colors: {
        navy: {
          950: '#04080f',
          900: '#080c14',
          800: '#0d1320',
          700: '#111827',
          600: '#162032',
        },
        amber: {
          brand: '#d97706',
          bright: '#f59e0b',
          dim: 'rgba(217,119,6,0.12)',
          glow: 'rgba(217,119,6,0.20)',
        },
        slate: {
          cf: '#64748b',
          light: '#94a3b8',
          lighter: '#cbd5e1',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-up': 'fadeUp 0.6s ease forwards',
        'scan': 'scan 4s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(400%)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
