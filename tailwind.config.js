/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1B3A6B',
          secondary: '#F5A623',
        },
        sidebar: {
          DEFAULT: '#222E6A',
          active: '#454D7C',
          hover: '#2d3a7a',
        },
        maintenance: {
          cnsd: '#1B5E82',
          tfp: '#1A5C34',
          wo: '#6D28D9',
          normal: '#10B981',
          abnormal: '#EF4444',
          warning: '#F59E0B',
          soon: '#9CA3AF',
        },
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
}
