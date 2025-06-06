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
        },
        error: {
          light: '#fef2f2',      // bg-red-50
          border: '#fecaca',     // border-red-200
          text: '#b91c1c',       // text-red-700
          button: '#fee2e2',     // bg-red-100
          'button-hover': '#fecaca', // hover:bg-red-200
        },
        warning: {
          light: '#fefce8',      // bg-yellow-50
          border: '#fde047',     // border-yellow-200
          text: '#a16207',       // text-yellow-800
          button: '#ca8a04',     // text-yellow-600
          'button-hover': '#a16207', // hover:text-yellow-800
        }
      },
      fontFamily: {
        'hero': ['Crimson Text', 'serif'],
        'title': ['Fjalla One', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
};