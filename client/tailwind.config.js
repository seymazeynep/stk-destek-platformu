/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        white: '#f8f5ef',
        brand: {
          50: 'var(--brand-50)', 100: 'var(--brand-100)', 200: 'var(--brand-200)', 300: 'var(--brand-300)',
          400: 'var(--brand-400)', 500: 'var(--brand-500)', 600: 'var(--brand-600)', 700: 'var(--brand-700)',
          800: 'var(--brand-800)', 900: 'var(--brand-900)', 950: 'var(--brand-950)',
        },
        navy: {
          50: 'var(--surface)', 100: 'var(--surface)', 200: 'var(--mist)', 300: 'var(--mist)',
          400: 'var(--muted)', 500: 'var(--muted)', 600: 'var(--muted)', 700: 'var(--text-soft)',
          800: 'var(--text)', 900: 'var(--text)', 950: 'var(--text)',
        },
        sand: {
          50: 'var(--background)', 100: 'var(--surface-alt)', 200: 'var(--border)', 300: 'var(--border)',
        },
        emerald: {
          50: 'var(--surface-alt)', 100: 'var(--mist)', 200: 'var(--mist)', 300: 'var(--mist)',
          400: 'var(--muted)', 500: 'var(--muted)', 600: 'var(--accent)', 700: 'var(--accent)', 800: 'var(--text)',
        },
        rose: {
          50: 'var(--surface-alt)', 100: 'var(--mist)', 200: 'var(--border)', 300: 'var(--mist)',
          400: 'var(--muted)', 500: 'var(--muted)', 600: 'var(--accent)', 700: 'var(--text)', 800: 'var(--text)',
        },
        red: {
          50: 'var(--surface-alt)', 100: 'var(--mist)', 200: 'var(--border)', 300: 'var(--mist)',
          400: 'var(--muted)', 500: 'var(--muted)', 600: 'var(--accent)', 700: 'var(--text)', 800: 'var(--text)',
        },
        amber: {
          50: 'var(--surface-alt)', 100: 'var(--mist)', 200: 'var(--mist)', 300: 'var(--mist)',
          400: 'var(--muted)', 500: 'var(--muted)', 600: 'var(--accent)', 700: 'var(--text)', 800: 'var(--text)',
        },
        blue: {
          50: 'var(--surface-alt)', 100: 'var(--mist)', 200: 'var(--mist)', 300: 'var(--mist)',
          400: 'var(--muted)', 500: 'var(--muted)', 600: 'var(--accent)', 700: 'var(--text)', 800: 'var(--text)',
        },
        teal: {
          50: 'var(--surface-alt)', 100: 'var(--mist)', 200: 'var(--mist)', 300: 'var(--mist)',
          400: 'var(--muted)', 500: 'var(--muted)', 600: 'var(--accent)', 700: 'var(--text)', 800: 'var(--text)',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(98, 114, 129, 0.10)',
        'card': '0 10px 25px -8px rgba(86, 43, 29, 0.18)',
        'floating': '0 20px 40px -15px rgba(86, 43, 29, 0.24)',
        'glow': '0 0 25px rgba(185, 182, 192, 0.45)',
      },
      borderRadius: {
        md: '0.25rem',
        lg: '0.3rem',
        xl: '0.4rem',
        '2xl': '0.5rem',
        '3xl': '0.625rem',
        '4xl': '0.75rem',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
