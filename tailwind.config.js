/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ink: "#17212b",
        line: "#d9dfdc",
        panel: "#f7f9f6",
        brand: "#1f6f78",
        mint: "#16865f",
        amber: "#b7791f",
        coral: "#b94a38",
        night: "#142126",
        paper: "#fbfcf8",
      },
    },
  },
  plugins: [],
};
