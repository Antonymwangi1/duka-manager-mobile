/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#282828",
        "bg-soft": "#32302f",
        "bg-hard": "#1d2021",
        fg: "#ebdbb2",
        yellow: "#fabd2f",
        green: "#b8bb26",
        red: "#fb4934",
        blue: "#83a598",
        gray: "#928374",
      },
    },
  },
  plugins: [],
};
