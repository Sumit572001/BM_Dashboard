/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nyati: {
          navy: '#004080',
          orange: '#E76F2E',
          bg: '#F0F4F8',
          text: '#1A202C',
          card: '#FFFFFF',
          success: '#38A169',
          warning: '#D69E2E',
          danger: '#E53E3E',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 10px 30px -15px rgba(0, 64, 128, 0.15)',
        'premium-hover': '0 20px 40px -20px rgba(231, 111, 46, 0.25)',
      }
    },
  },
  plugins: [],
}
