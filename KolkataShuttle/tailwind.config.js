/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#ffffff',
        background: '#000000',
        surface: '#1a1a1a',
        border: '#333333',
        text: '#ffffff',
        textSecondary: '#aaaaaa',
        green: { 800: '#166534' },
        red: { 800: '#991b1b' },
      },
    },
  },
  plugins: [],
};