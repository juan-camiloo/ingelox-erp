/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#F35815',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          orange: '#F35815',
          DEFAULT: '#F35815',
        },
        navy: {
          50:  '#eef2f8',
          100: '#d5dff0',
          200: '#abbfe0',
          300: '#7d9ecf',
          400: '#4f7dbf',
          500: '#2d5c9e',
          600: '#234a80',
          700: '#1a3a63',
          800: '#122947',
          900: '#0a1a2e',
          DEFAULT: '#1a3a63',
        },
      },
    },
  },
  plugins: [],
}


