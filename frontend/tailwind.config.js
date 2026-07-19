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
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          550: '#16a34a', // Emerald/green color palette for Islamic boarding school
          600: '#15803d',
          700: '#166534',
          800: '#14532d',
          900: '#14532d',
        }
      }
    },
  },
  plugins: [],
}
