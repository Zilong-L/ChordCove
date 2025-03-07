/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      backgroundColor: {
        dark: '#121212',
      },
      textColor: {
        dark: '#ffffff',
      },
    },
  },
  plugins: [],
}