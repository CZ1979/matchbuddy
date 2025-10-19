/* eslint-env node */
/* global module, require */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Rubik", "sans-serif"],
      },
      keyframes: {
        scale: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' }
        },
        'bounce-slight': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6%)' },
        },
      },
      animation: {
        'bounce-slight': 'bounce-slight 1.2s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        friendly: {
          primary: "#00B86B",      // Grün
          secondary: "#101820",
          accent: "#34d399",
          neutral: "#1f2937",
          "base-100": "#ffffff",
          "base-200": "#f3f4f6",
          "base-300": "#e5e7eb",
          info: "#3abff8",
          success: "#36d399",
          warning: "#fbbd23",
          error: "#f87272",
        },
      },
      "dark",
    ],
    darkTheme: "dark",
  },
};
