/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        ink: {
          950: "#0b1017",
        },
        cobalt: {
          100: "#dbe5ff",
          200: "#bed0ff",
          300: "#92adff",
          400: "#6f8fff",
          500: "#4c6ef5",
        },
      },
      fontFamily: {
        display: ['"Avenir Next"', '"Futura"', "sans-serif"],
        body: ['"IBM Plex Sans"', '"Segoe UI"', "sans-serif"],
      },
      boxShadow: {
        panel: "0 24px 80px rgba(0, 0, 0, 0.28)",
      },
    },
  },
  plugins: [],
};
