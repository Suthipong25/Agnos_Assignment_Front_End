/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17211c",
        mist: "#f4f7f5",
        line: "#d7e0d9",
        clinic: "#0f766e",
        coral: "#c05640",
        wheat: "#efe5d0"
      },
      boxShadow: {
        soft: "0 14px 40px rgba(23, 33, 28, 0.08)"
      }
    }
  },
  plugins: []
};

module.exports = config;
