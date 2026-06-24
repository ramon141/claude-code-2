/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1d4ed8',
          light: '#EFF6FF',
        },
        danger: {
          DEFAULT: '#EF4444',
          hover: '#DC2626',
          light: '#FEF2F2',
        },
        // Semantic
        success: {
          DEFAULT: '#10B981',
          hover: '#059669',
          light: '#ECFDF5',
          text: '#065F46',
        },
        warning: {
          DEFAULT: '#F59E0B',
          hover: '#D97706',
          light: '#FFFBEB',
          text: '#92400E',
        },
        info: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          light: '#EFF6FF',
          text: '#1E40AF',
        },
        // Layout
        sidebar: {
          DEFAULT: '#0F172A',
          hover: 'rgba(255,255,255,0.06)',
          active: 'rgba(255,255,255,0.10)',
          border: 'rgba(255,255,255,0.08)',
          text: '#CBD5E1',
          'text-active': '#F1F5F9',
        },
        surface: '#FFFFFF',
        base: '#F1F5F9',
        border: '#E2E8F0',
        muted: '#94A3B8',
        claude: {
          bg: '#1A1A1A',
          surface: '#2A2A2A',
          border: '#3A3A3A',
          text: '#F5F5F5',
          muted: '#9A9A9A',
          primary: '#D97757',
          'primary-hover': '#C4663F',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"Titillium Web"', 'sans-serif'],
      },
      fontSize: {
        // Typography scale
        'display': ['1.5rem',   { lineHeight: '2rem',    fontWeight: '700', letterSpacing: '-0.025em' }],
        'heading':  ['1.125rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'subhead':  ['0.9375rem', { lineHeight: '1.5rem', fontWeight: '500' }],
        'body':     ['0.875rem', { lineHeight: '1.375rem', fontWeight: '400' }],
        'caption':  ['0.75rem',  { lineHeight: '1rem',   fontWeight: '400' }],
        'label':    ['0.6875rem',{ lineHeight: '1rem',   fontWeight: '600', letterSpacing: '0.05em' }],
      },
      boxShadow: {
        card:     '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)',
        'card-md': '0 4px 16px rgba(0,0,0,0.07)',
        header:   '0 1px 0 #E2E8F0',
        sidebar:  '1px 0 0 rgba(255,255,255,0.06)',
        dropdown: '0 8px 30px rgba(0,0,0,0.12)',
        'focus':  '0 0 0 3px rgba(37,99,235,0.15)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      transitionDuration: {
        '220': '220ms',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
