/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        main: '#000000',    // Black
        mid: '#5b5b5b' , // dark grey
        inverse: '#ffffff', // White
        accent: {
          primary: '#557e00', // Main green
          secondary: '#6f9b15',// Light green
        }
      },
      fontFamily: {
        'title': ['Crimson Text', 'serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
};