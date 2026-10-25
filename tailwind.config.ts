import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F2F5F4',
        surface: '#FFFFFF',
        ink: '#12262B',
        muted: '#587078',
        line: '#D6E0E1',
        brand: { DEFAULT: '#0A5C66', dark: '#074650', soft: '#E1F0F1' },
        marigold: { DEFAULT: '#F4B400', soft: '#FFF3CC' },
        danger: '#B3261E',
      },
      fontFamily: { sans: ['var(--font-sans)', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
export default config
