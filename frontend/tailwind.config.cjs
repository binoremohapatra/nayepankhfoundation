/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Simple palette — no opacity modifiers needed in @apply
        forest:   '#1F3A2E',
        'forest-light': '#2e6249',
        moss:     '#3F6F52',
        'moss-dark': '#2e6249',
        paper:    '#FAF6EE',
        cream:    '#FDF9F3',
        sage:     '#EEF3E8',
        'sage-dark': '#D4E2C8',
        gold:     '#D9A441',
        'gold-light': '#F5C96A',
        'gold-dark':  '#B5832A',
        ink:      '#1C1C1C',
        muted:    '#6B7280',
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
        mono:  ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card':    '0 4px 24px -4px rgba(31,58,46,0.10), 0 2px 8px -2px rgba(31,58,46,0.06)',
        'card-lg': '0 12px 48px -8px rgba(31,58,46,0.18), 0 4px 16px -4px rgba(31,58,46,0.10)',
        'glow':    '0 0 32px 8px rgba(63,111,82,0.18)',
        'gold':    '0 0 24px 4px rgba(217,164,65,0.22)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #1F3A2E 0%, #2e6249 50%, #3F6F52 100%)',
        'gold-gradient': 'linear-gradient(135deg, #D9A441 0%, #F5C96A 100%)',
        'moss-gradient': 'linear-gradient(135deg, #3F6F52 0%, #2e6249 100%)',
      },
      animation: {
        'pulse-slow':  'pulse 3s ease-in-out infinite',
        'spin-slow':   'spin 3s linear infinite',
        'bounce-soft': 'bounce 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
