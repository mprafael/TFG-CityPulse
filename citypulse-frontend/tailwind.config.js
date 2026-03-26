/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // ¡Esta línea es la que busca tus clases!
  ],
  theme: {
    extend: {
      colors: {
        'citypulse-blue': '#2563eb',
      }
    },
  },
  plugins: [],
}