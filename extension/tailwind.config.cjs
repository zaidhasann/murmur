/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,js,ts,jsx,tsx}',
    '../components/**/*.{js,ts,jsx,tsx}',
    '../lib/**/*.{js,ts,jsx,tsx}',
    '../app/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
};
