/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.{html,js}",
    "./src/**/*.{html,js}",
    "./*.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#FF5733",
        secondary: "#333333"
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
        serif: ['Georgia', 'serif']
      }
    },
  },
  plugins: [],
} 