/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // Systematic type scale — 12 / 13 / 14 / 16 / 18 / 20 / 24 / 30 / 38 / 48
    fontSize: {
      '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.04em' }],
      xs: ['0.75rem', { lineHeight: '1.0625rem', letterSpacing: '0.01em' }],
      sm: ['0.8125rem', { lineHeight: '1.1875rem' }],
      base: ['0.9375rem', { lineHeight: '1.5rem' }],
      md: ['1rem', { lineHeight: '1.5625rem' }],
      lg: ['1.125rem', { lineHeight: '1.6rem', letterSpacing: '-0.011em' }],
      xl: ['1.25rem', { lineHeight: '1.65rem', letterSpacing: '-0.014em' }],
      '2xl': ['1.5rem', { lineHeight: '1.85rem', letterSpacing: '-0.019em' }],
      '3xl': ['1.875rem', { lineHeight: '2.15rem', letterSpacing: '-0.022em' }],
      '4xl': ['2.375rem', { lineHeight: '2.6rem', letterSpacing: '-0.026em' }],
      '5xl': ['3rem', { lineHeight: '3.15rem', letterSpacing: '-0.03em' }],
    },
    extend: {
      fontFamily: {
        display: ['Lexend', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Inter Variable"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // Brand — deep forest green, calm and institutional
        brand: {
          50: '#EEF6EF',
          100: '#D6EAD8',
          200: '#ADD5B2',
          300: '#7FBB87',
          400: '#529E5D',
          500: '#2E7D32',
          600: '#25682A',
          700: '#1D5322',
          800: '#163F1A',
          900: '#0F2B12',
        },
        // Neutral — slightly warm slate, reads as paper not plastic
        ink: {
          50: '#F7F8F7',
          100: '#EEF0EE',
          200: '#E2E5E2',
          300: '#CBD0CB',
          400: '#9AA29A',
          500: '#6F776F',
          600: '#525A52',
          700: '#3D443D',
          800: '#272C27',
          900: '#141814',
        },
        canvas: '#FBFAF8',
        surface: '#FFFFFF',
        // Semantic status
        ok: { soft: '#E8F4E9', base: '#2E7D32', text: '#1D5322' },
        warn: { soft: '#FDF3E3', base: '#B26B00', text: '#7A4A00' },
        bad: { soft: '#FCEBEC', base: '#C62828', text: '#8E1B1B' },
        info: { soft: '#E9F1FA', base: '#2F6FB0', text: '#1F4C7A' },
      },
      borderRadius: {
        sm: '0.375rem',
        DEFAULT: '0.5rem',
        md: '0.625rem',
        lg: '0.875rem',
        xl: '1.125rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        // Restrained, single-source elevation scale
        xs: '0 1px 2px 0 rgb(20 24 20 / 0.05)',
        sm: '0 1px 3px 0 rgb(20 24 20 / 0.07), 0 1px 2px -1px rgb(20 24 20 / 0.05)',
        md: '0 4px 12px -2px rgb(20 24 20 / 0.08), 0 2px 4px -2px rgb(20 24 20 / 0.05)',
        lg: '0 12px 28px -6px rgb(20 24 20 / 0.12), 0 4px 8px -4px rgb(20 24 20 / 0.06)',
        nav: '0 -1px 0 0 rgb(20 24 20 / 0.06)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
        spring: 'cubic-bezier(0.34, 1.4, 0.64, 1)',
      },
      keyframes: {
        'fade-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scan-line': { '0%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(150px)' }, '100%': { transform: 'translateY(0)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'ring-pulse': { '0%,100%': { opacity: '0.35', transform: 'scale(1)' }, '50%': { opacity: '0', transform: 'scale(1.35)' } },
      },
      animation: {
        'fade-up': 'fade-up 0.36s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.28s ease-out both',
        'scan-line': 'scan-line 2.6s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
        'ring-pulse': 'ring-pulse 2s ease-out infinite',
      },
    },
  },
  plugins: [],
}
