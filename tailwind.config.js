/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          yellow: '#FFE135',
          purple: '#9747FF',
        },
      },
      fontFamily: {
        'source-code': ['"Source Code Pro"', 'monospace'],
      },
    },
  },
  plugins: [],
};