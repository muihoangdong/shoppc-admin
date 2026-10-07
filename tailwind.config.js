/** @type {import('tailwindcss').Config} */
export default {
  // Bật chế độ tối bằng class "dark" trên <html> (xem src/utils/theme.ts). Màu lấy từ biến CSS trong src/theme.css
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: { 50: 'rgb(var(--c-slate-50) / <alpha-value>)', 100: 'rgb(var(--c-slate-100) / <alpha-value>)', 200: 'rgb(var(--c-slate-200) / <alpha-value>)', 300: 'rgb(var(--c-slate-300) / <alpha-value>)', 400: 'rgb(var(--c-slate-400) / <alpha-value>)', 500: 'rgb(var(--c-slate-500) / <alpha-value>)', 600: 'rgb(var(--c-slate-600) / <alpha-value>)', 700: 'rgb(var(--c-slate-700) / <alpha-value>)', 800: 'rgb(var(--c-slate-800) / <alpha-value>)', 900: 'rgb(var(--c-slate-900) / <alpha-value>)', 950: 'rgb(var(--c-slate-950) / <alpha-value>)' },
        slate: { 50: 'rgb(var(--c-slate-50) / <alpha-value>)', 100: 'rgb(var(--c-slate-100) / <alpha-value>)', 200: 'rgb(var(--c-slate-200) / <alpha-value>)', 300: 'rgb(var(--c-slate-300) / <alpha-value>)', 400: 'rgb(var(--c-slate-400) / <alpha-value>)', 500: 'rgb(var(--c-slate-500) / <alpha-value>)', 600: 'rgb(var(--c-slate-600) / <alpha-value>)', 700: 'rgb(var(--c-slate-700) / <alpha-value>)', 800: 'rgb(var(--c-slate-800) / <alpha-value>)', 900: 'rgb(var(--c-slate-900) / <alpha-value>)', 950: 'rgb(var(--c-slate-950) / <alpha-value>)' },
        blue: { 50: 'rgb(var(--c-indigo-50) / <alpha-value>)', 100: 'rgb(var(--c-indigo-100) / <alpha-value>)', 200: 'rgb(var(--c-indigo-200) / <alpha-value>)', 300: 'rgb(var(--c-indigo-300) / <alpha-value>)', 400: 'rgb(var(--c-indigo-400) / <alpha-value>)', 500: 'rgb(var(--c-indigo-500) / <alpha-value>)', 600: 'rgb(var(--c-indigo-600) / <alpha-value>)', 700: 'rgb(var(--c-indigo-700) / <alpha-value>)', 800: 'rgb(var(--c-indigo-800) / <alpha-value>)', 900: 'rgb(var(--c-indigo-900) / <alpha-value>)', 950: 'rgb(var(--c-indigo-950) / <alpha-value>)' },
        indigo: { 50: 'rgb(var(--c-indigo-50) / <alpha-value>)', 100: 'rgb(var(--c-indigo-100) / <alpha-value>)', 200: 'rgb(var(--c-indigo-200) / <alpha-value>)', 300: 'rgb(var(--c-indigo-300) / <alpha-value>)', 400: 'rgb(var(--c-indigo-400) / <alpha-value>)', 500: 'rgb(var(--c-indigo-500) / <alpha-value>)', 600: 'rgb(var(--c-indigo-600) / <alpha-value>)', 700: 'rgb(var(--c-indigo-700) / <alpha-value>)', 800: 'rgb(var(--c-indigo-800) / <alpha-value>)', 900: 'rgb(var(--c-indigo-900) / <alpha-value>)', 950: 'rgb(var(--c-indigo-950) / <alpha-value>)' },
        primary: { 50: 'rgb(var(--c-indigo-50) / <alpha-value>)', 100: 'rgb(var(--c-indigo-100) / <alpha-value>)', 200: 'rgb(var(--c-indigo-200) / <alpha-value>)', 300: 'rgb(var(--c-indigo-300) / <alpha-value>)', 400: 'rgb(var(--c-indigo-400) / <alpha-value>)', 500: 'rgb(var(--c-indigo-500) / <alpha-value>)', 600: 'rgb(var(--c-indigo-600) / <alpha-value>)', 700: 'rgb(var(--c-indigo-700) / <alpha-value>)', 800: 'rgb(var(--c-indigo-800) / <alpha-value>)', 900: 'rgb(var(--c-indigo-900) / <alpha-value>)', 950: 'rgb(var(--c-indigo-950) / <alpha-value>)' },
        red: { 50: 'rgb(var(--c-red-50) / <alpha-value>)', 100: 'rgb(var(--c-red-100) / <alpha-value>)', 200: 'rgb(var(--c-red-200) / <alpha-value>)', 300: 'rgb(var(--c-red-300) / <alpha-value>)', 400: 'rgb(var(--c-red-400) / <alpha-value>)', 500: 'rgb(var(--c-red-500) / <alpha-value>)', 600: 'rgb(var(--c-red-600) / <alpha-value>)', 700: 'rgb(var(--c-red-700) / <alpha-value>)', 800: 'rgb(var(--c-red-800) / <alpha-value>)', 900: 'rgb(var(--c-red-900) / <alpha-value>)', 950: 'rgb(var(--c-red-950) / <alpha-value>)' },
        green: { 50: 'rgb(var(--c-green-50) / <alpha-value>)', 100: 'rgb(var(--c-green-100) / <alpha-value>)', 200: 'rgb(var(--c-green-200) / <alpha-value>)', 300: 'rgb(var(--c-green-300) / <alpha-value>)', 400: 'rgb(var(--c-green-400) / <alpha-value>)', 500: 'rgb(var(--c-green-500) / <alpha-value>)', 600: 'rgb(var(--c-green-600) / <alpha-value>)', 700: 'rgb(var(--c-green-700) / <alpha-value>)', 800: 'rgb(var(--c-green-800) / <alpha-value>)', 900: 'rgb(var(--c-green-900) / <alpha-value>)', 950: 'rgb(var(--c-green-950) / <alpha-value>)' },
        yellow: { 50: 'rgb(var(--c-yellow-50) / <alpha-value>)', 100: 'rgb(var(--c-yellow-100) / <alpha-value>)', 200: 'rgb(var(--c-yellow-200) / <alpha-value>)', 300: 'rgb(var(--c-yellow-300) / <alpha-value>)', 400: 'rgb(var(--c-yellow-400) / <alpha-value>)', 500: 'rgb(var(--c-yellow-500) / <alpha-value>)', 600: 'rgb(var(--c-yellow-600) / <alpha-value>)', 700: 'rgb(var(--c-yellow-700) / <alpha-value>)', 800: 'rgb(var(--c-yellow-800) / <alpha-value>)', 900: 'rgb(var(--c-yellow-900) / <alpha-value>)', 950: 'rgb(var(--c-yellow-950) / <alpha-value>)' },
        amber: { 50: 'rgb(var(--c-amber-50) / <alpha-value>)', 100: 'rgb(var(--c-amber-100) / <alpha-value>)', 200: 'rgb(var(--c-amber-200) / <alpha-value>)', 300: 'rgb(var(--c-amber-300) / <alpha-value>)', 400: 'rgb(var(--c-amber-400) / <alpha-value>)', 500: 'rgb(var(--c-amber-500) / <alpha-value>)', 600: 'rgb(var(--c-amber-600) / <alpha-value>)', 700: 'rgb(var(--c-amber-700) / <alpha-value>)', 800: 'rgb(var(--c-amber-800) / <alpha-value>)', 900: 'rgb(var(--c-amber-900) / <alpha-value>)', 950: 'rgb(var(--c-amber-950) / <alpha-value>)' },
        orange: { 50: 'rgb(var(--c-orange-50) / <alpha-value>)', 100: 'rgb(var(--c-orange-100) / <alpha-value>)', 200: 'rgb(var(--c-orange-200) / <alpha-value>)', 300: 'rgb(var(--c-orange-300) / <alpha-value>)', 400: 'rgb(var(--c-orange-400) / <alpha-value>)', 500: 'rgb(var(--c-orange-500) / <alpha-value>)', 600: 'rgb(var(--c-orange-600) / <alpha-value>)', 700: 'rgb(var(--c-orange-700) / <alpha-value>)', 800: 'rgb(var(--c-orange-800) / <alpha-value>)', 900: 'rgb(var(--c-orange-900) / <alpha-value>)', 950: 'rgb(var(--c-orange-950) / <alpha-value>)' },
        purple: { 50: 'rgb(var(--c-purple-50) / <alpha-value>)', 100: 'rgb(var(--c-purple-100) / <alpha-value>)', 200: 'rgb(var(--c-purple-200) / <alpha-value>)', 300: 'rgb(var(--c-purple-300) / <alpha-value>)', 400: 'rgb(var(--c-purple-400) / <alpha-value>)', 500: 'rgb(var(--c-purple-500) / <alpha-value>)', 600: 'rgb(var(--c-purple-600) / <alpha-value>)', 700: 'rgb(var(--c-purple-700) / <alpha-value>)', 800: 'rgb(var(--c-purple-800) / <alpha-value>)', 900: 'rgb(var(--c-purple-900) / <alpha-value>)', 950: 'rgb(var(--c-purple-950) / <alpha-value>)' },
        teal: { 50: 'rgb(var(--c-teal-50) / <alpha-value>)', 100: 'rgb(var(--c-teal-100) / <alpha-value>)', 200: 'rgb(var(--c-teal-200) / <alpha-value>)', 300: 'rgb(var(--c-teal-300) / <alpha-value>)', 400: 'rgb(var(--c-teal-400) / <alpha-value>)', 500: 'rgb(var(--c-teal-500) / <alpha-value>)', 600: 'rgb(var(--c-teal-600) / <alpha-value>)', 700: 'rgb(var(--c-teal-700) / <alpha-value>)', 800: 'rgb(var(--c-teal-800) / <alpha-value>)', 900: 'rgb(var(--c-teal-900) / <alpha-value>)', 950: 'rgb(var(--c-teal-950) / <alpha-value>)' },
        surface: 'rgb(var(--surface) / <alpha-value>)',
        app: 'rgb(var(--app-bg) / <alpha-value>)',
        sidebar: 'rgb(var(--sidebar) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
}