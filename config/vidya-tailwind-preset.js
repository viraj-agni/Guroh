/**
 * Vidya design tokens for Tailwind CSS v3+.
 * Mirrors DESIGN.md. When the Next.js app exists, add:
 *   presets: [require('./config/vidya-tailwind-preset.js')]
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        vidya: {
          void: '#000000',
          'void-soft': '#0A0A0A',
          bg: '#050505',
          surface: '#0F0F0F',
          'surface-raised': '#161616',
          border: '#2A2418',
          text: '#F5F0E8',
          'text-muted': '#9A9288',
          accent: '#26C6B4',
          'accent-hover': '#4DD4C4',
          'accent-pressed': '#00897B',
          'accent-warm': '#FFB020',
          'accent-warm-strong': '#FF8C42',
          success: '#5AD98F',
          warning: '#F5C542',
          error: '#E53935',
          info: '#4FC3F7',
          'flame-highlight': '#FFF4D6',
          'flame-gold': '#FFD54F',
          'flame-amber': '#FFB020',
          'flame-orange': '#FF8C42',
          'flame-ember': '#E64A19',
          'flame-coal': '#8B2C0A',
          'knowledge-teal': '#26C6B4',
          'knowledge-deep': '#00897B',
          'knowledge-abyss': '#004D40',
        },
      },
      backgroundImage: {
        'vidya-warm-arc':
          'linear-gradient(180deg, #FFD54F 0%, #FF8C42 45%, #E64A19 100%)',
        'vidya-teal-drop':
          'linear-gradient(180deg, #26C6B4 0%, #00897B 55%, #004D40 100%)',
        'vidya-inner-flame':
          'linear-gradient(180deg, #FFF4D6 0%, #FFB020 40%, #C62828 100%)',
      },
    },
  },
}
