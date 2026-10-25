/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vibe: {
          dark: '#080a0f',
          card: '#0f141f',
          surface: '#151c2c',
          border: 'rgba(255, 255, 255, 0.08)',
          green: '#00d679',
          cyan: '#00f2fe',
          blue: '#4facfe',
          pink: '#f43f5e',
          purple: '#8b5cf6'
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s infinite ease-in-out',
        'ripple': 'ripple 3s cubic-bezier(0, 0.2, 0.8, 1) infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8', filter: 'blur(20px)' },
          '50%': { transform: 'scale(1.15)', opacity: '1', filter: 'blur(30px)' },
        },
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}
