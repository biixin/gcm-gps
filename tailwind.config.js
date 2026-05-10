/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        tactical: {
          ink: '#020617',
          panel: '#06111f',
          panel2: '#0a1628',
          line: '#1e3a5f',
          cyan: '#38bdf8',
          blue: '#2563eb',
          alert: '#ef4444'
        }
      },
      boxShadow: {
        glow: '0 0 30px rgba(56, 189, 248, 0.18)',
        alert: '0 0 28px rgba(239, 68, 68, 0.35)'
      },
      keyframes: {
        pulseCritical: {
          '0%, 100%': { opacity: '0.42' },
          '50%': { opacity: '0.92' }
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        }
      },
      animation: {
        critical: 'pulseCritical 1.1s ease-in-out infinite',
        radar: 'radarSweep 8s linear infinite'
      }
    }
  },
  plugins: [],
};
