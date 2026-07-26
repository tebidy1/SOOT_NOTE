/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './popup/index.html'
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          50: 'var(--color-blue-50, #eff6ff)',
          100: 'var(--color-blue-100, #dbeafe)',
          200: 'var(--color-blue-200, #bfdbfe)',
          300: 'var(--color-blue-300, #93c5fd)',
          400: 'var(--color-blue-400, #60a5fa)',
          500: 'var(--color-blue-500, #3b82f6)',
          600: 'var(--color-blue-600, #2563eb)',
          700: 'var(--color-blue-700, #1d4ed8)',
          800: 'var(--color-blue-800, #1e40af)',
          900: 'var(--color-blue-900, #1e3a8a)',
        },
        slateDark: {
          bg: '#0F172A',
          border: '#334155',
          text: '#F1F5F9',
          hover: '#1E293B',
          divider: '#334155',
          icon: '#38BDF8'
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a'
        },
        medical: {
          blue: '#1e40af',
          teal: '#0d9488',
          green: '#10b981',
          red: '#ef4444',
          amber: '#f59e0b'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'wave': 'wave 1.5s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1)' }
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' }
        }
      }
    }
  },
  plugins: []
}