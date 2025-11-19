/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        subsonic: {
          bg: '#121212',
          card: '#1E1E1E',
          primary: '#FF8C00',
          text: '#FFFFFF',
          secondary: '#B3B3B3',
          accent: '#BB86FC'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}