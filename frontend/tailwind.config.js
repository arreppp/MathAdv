/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Baloo 2"', 'ui-rounded', '"Comic Sans MS"', 'sans-serif'],
        body: ['"Nunito"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        adventure: {
          50: '#f4faf1',
          100: '#e2f3d9',
          200: '#c5e7b3',
          300: '#9fd485',
          400: '#74bd5a',
          500: '#4f9f3a',
          600: '#3c7f2c',
          700: '#316526',
          800: '#2a5122',
          900: '#24441f',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        magic: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
        parchment: '#fdf6e3',
      },
    },
  },
  plugins: [],
}
