/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          50:  '#FCF1ED',
          100: '#F8DDD3',
          500: '#E04E2A',
          600: '#C53E1C',
          700: '#9F3215',
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'Iowan Old Style', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter:  '-0.025em',
      },
      borderRadius: {
        '4xl': '28px',
      },
      boxShadow: {
        hairline: '0 0 0 1px rgba(15,14,12,0.06)',
        soft:     '0 1px 1px rgba(15,14,12,0.04), 0 4px 12px -4px rgba(15,14,12,0.08)',
        lift:     '0 1px 1px rgba(15,14,12,0.06), 0 12px 32px -8px rgba(15,14,12,0.16)',
        deep:     '0 2px 4px rgba(15,14,12,0.08), 0 28px 56px -12px rgba(15,14,12,0.22)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
