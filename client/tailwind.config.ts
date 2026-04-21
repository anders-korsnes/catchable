import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Modern UI base
        bg: { DEFAULT: '#F5F5F4', dark: '#0C0A09' },
        surface: { DEFAULT: '#FFFFFF', dark: '#1C1917' },
        ink: { DEFAULT: '#1C1917', muted: '#78716C', invert: '#F5F5F4' },
        line: { DEFAULT: '#E7E5E4', dark: '#292524' },
        // Retro accents
        pokered: '#DC2626',
        gbgreen: {
          50: '#9BBC0F',
          200: '#8BAC0F',
          400: '#306230',
          600: '#0F380F',
        },
        action: '#3B82F6',
        like: '#10B981',
        dislike: '#71717A',
        warn: '#F59E0B',
        // Canonical Pokémon type colors
        type: {
          normal: '#A8A77A',
          fire: '#EE8130',
          water: '#6390F0',
          electric: '#F7D02C',
          grass: '#7AC74C',
          ice: '#96D9D6',
          fighting: '#C22E28',
          poison: '#A33EA1',
          ground: '#E2BF65',
          flying: '#A98FF3',
          psychic: '#F95587',
          bug: '#A6B91A',
          rock: '#B6A136',
          ghost: '#735797',
          dragon: '#6F35FC',
          dark: '#705746',
          steel: '#B7B7CE',
          fairy: '#D685AD',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        Bungee: ['Bungee', 'system-ui', 'sans-serif'],
        pixel: ['"Press Start 2P"', '"VT323"', 'monospace'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        device: '0 1px 2px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.12)',
      },
      borderRadius: {
        device: '20px',
        screen: '8px',
      },
      backgroundImage: {
        'gb-dotmatrix':
          'radial-gradient(rgba(15,56,15,0.18) 1px, transparent 1px)',
      },
      backgroundSize: {
        'gb-dotmatrix': '4px 4px',
      },
    },
  },
  plugins: [],
};

export default config;
