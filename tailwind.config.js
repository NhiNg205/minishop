/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#dbeafe', // Màu xanh biển rất nhạt (cho nền banner)
          DEFAULT: '#1d4ed8', // Màu xanh biển chuẩn, đậm đà, rõ nét
          dark: '#1e3a8a', // Màu xanh biển navy đậm (cho chữ và tiêu đề)
        },
      },
    },
  },
  plugins: [],
}