/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // SM3D Dark Theme Palette
        background: '#0E0E0E',
        surface: '#121212',
        border: '#262626',
        accent: '#E50914',
        text: {
          primary: '#FFFFFF',
          secondary: '#AAAAAA',
          muted: '#666666',
        },
        // Additional semantic colors
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
        // Platform brand colors
        platforms: {
          twitter: '#1DA1F2',
          facebook: '#1877F2',
          instagram: '#E4405F',
          linkedin: '#0A66C2',
          tiktok: '#FE2C55',
          youtube: '#FF0000',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        // SM3D Typography Scale
        'h1': ['28px', { lineHeight: '36px', fontWeight: '700' }], // Page Titles
        'h2': ['22px', { lineHeight: '28px', fontWeight: '600' }], // Section Headers
        'body': ['16px', { lineHeight: '24px', fontWeight: '400' }], // Paragraphs
        'caption': ['12px', { lineHeight: '16px', fontWeight: '400' }], // Metadata
      },
      spacing: {
        // 8-point spacing grid
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        // SM3D Card Radius
        'card': '16px',
        'button': '8px',
      },
      boxShadow: {
        // Subtle shadows for dark theme
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
        'glow': '0 0 20px rgba(229, 9, 20, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fadeIn': 'fadeIn 0.5s ease-in-out',
        'slideUp': 'slideUp 0.3s ease-out',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(10px)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
        shimmer: {
          '0%': {
            backgroundPosition: '-200px 0',
          },
          '100%': {
            backgroundPosition: 'calc(200px + 100%) 0',
          },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}