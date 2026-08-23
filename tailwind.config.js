/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#171717',
          light: '#F7F5F1',
          white: '#FFFFFF',
          accent: '#FF5A1F',
          accentHover: '#E64F19',
          accentLight: 'rgba(255, 90, 31, 0.08)',
          accentGlow: 'rgba(255, 90, 31, 0.25)',
          surface: '#FFFFFF',
          card: '#FFFFFF',
          muted: '#6B6B6B',
          border: 'rgba(0, 0, 0, 0.06)',
          borderLight: 'rgba(255, 255, 255, 0.12)',
        },
        semantic: {
          success: '#10B981',
          successLight: 'rgba(16, 185, 129, 0.1)',
          warning: '#F59E0B',
          warningLight: 'rgba(245, 158, 11, 0.1)',
          error: '#EF4444',
          errorLight: 'rgba(239, 68, 68, 0.1)',
          info: '#3B82F6',
          infoLight: 'rgba(59, 130, 246, 0.1)',
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.72)',
          dark: 'rgba(17, 17, 17, 0.78)',
          border: 'rgba(255, 255, 255, 0.18)',
          borderDark: 'rgba(255, 255, 255, 0.08)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Manrope', 'system-ui', '-apple-system', 'sans-serif']
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
        'pill': '9999px',
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
        'card': '0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)',
        'card-hover': '0 8px 25px rgba(0,0,0,0.08), 0 3px 10px rgba(0,0,0,0.04)',
        'glass': '0 8px 32px rgba(0,0,0,0.08)',
        'glass-lg': '0 12px 40px rgba(0,0,0,0.12)',
        'glow': '0 0 20px rgba(241, 90, 36, 0.15)',
        'glow-lg': '0 0 30px rgba(241, 90, 36, 0.2)',
        'float': '0 20px 60px rgba(0,0,0,0.1), 0 8px 20px rgba(0,0,0,0.06)',
        'inner-soft': 'inset 0 1px 3px rgba(0,0,0,0.06)',
      },
      backdropBlur: {
        'xs': '4px',
        'glass': '16px',
        'glass-lg': '24px',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateX(100%) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateX(0) scale(1)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fade-in 0.25s ease-out forwards',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-right': 'slide-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'toast-in': 'toast-in 0.35s cubic-bezier(0.21, 1.02, 0.73, 1) forwards',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
}
