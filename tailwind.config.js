/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nsd: {
          navy:   "#0B1E3D",
          purple: "#7B3FE4",
          glow:   "#A67FF0",
          light:  "#EDE9FF",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
