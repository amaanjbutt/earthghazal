import type { Config } from 'tailwindcss'

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        urdu: ['"Noto Nastaliq Urdu"', 'serif'],
        ui: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Crimson Pro"', 'serif']
      }
    },
  },
  plugins: [],
} satisfies Config