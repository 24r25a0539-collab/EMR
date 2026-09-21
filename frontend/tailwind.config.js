/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Unified Premium Black Theme Palette
        dark: {
          bg: '#060709',
          surface: '#101012',
          surfaceSecondary: '#141416',
          surfaceTertiary: '#18181B',
          border: 'rgba(255, 255, 255, 0.08)',
          borderHover: 'rgba(255, 255, 255, 0.14)',
          text: '#F5F5F5',
          textSecondary: 'rgba(255, 255, 255, 0.65)',
          textMuted: 'rgba(255, 255, 255, 0.40)',
          blueGlow: '#3B82F6',
          brightBlue: '#3B82F6',
          teal: '#14B8A6',
          purpleGlow: '#8B5CF6',
          cyan: '#06B6D4',
        },

        // Backward Compatible Light & Medical Palette mapped for dark theme consistency
        light: {
          bg: '#060709',
          bgSecondary: '#101012',
          subtleBlue: 'rgba(59, 130, 246, 0.08)',
          softBlue: 'rgba(59, 130, 246, 0.12)',
          subtleTeal: 'rgba(20, 184, 166, 0.08)',
          textPrimary: '#F5F5F5',
          textSecondary: 'rgba(255, 255, 255, 0.65)',
          primaryBlue: '#3B82F6',
          teal: '#14B8A6',
          warmAccent: '#F59E0B',
        },

        medicalBlue: {
          DEFAULT: '#3B82F6',
          50: 'rgba(59, 130, 246, 0.06)',
          100: 'rgba(59, 130, 246, 0.12)',
          200: 'rgba(59, 130, 246, 0.20)',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
        },
        healthTeal: {
          DEFAULT: '#14B8A6',
          50: 'rgba(20, 184, 166, 0.06)',
          100: 'rgba(20, 184, 166, 0.12)',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
        },
        healthAqua: {
          DEFAULT: '#06B6D4',
          50: 'rgba(6, 182, 212, 0.06)',
          100: 'rgba(6, 182, 212, 0.12)',
          400: '#22D3EE',
          500: '#06B6D4',
        },
        softBlue: 'rgba(59, 130, 246, 0.12)',
        softTeal: 'rgba(20, 184, 166, 0.12)',
        warmAccent: '#F59E0B',
        lavenderAccent: 'rgba(139, 92, 246, 0.12)',
        softViolet: '#8B5CF6',
        bgLight: '#060709',
        darkText: '#F5F5F5',

        health: {
          50: 'rgba(59, 130, 246, 0.08)',
          100: 'rgba(59, 130, 246, 0.15)',
          200: 'rgba(59, 130, 246, 0.25)',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: 'rgba(59, 130, 246, 0.05)',
        },
        tealAccent: {
          50: 'rgba(20, 184, 166, 0.08)',
          100: 'rgba(20, 184, 166, 0.15)',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
        },
        emergency: {
          50: 'rgba(239, 68, 68, 0.08)',
          100: 'rgba(239, 68, 68, 0.15)',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        floatCard1: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        floatCard2: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(6px)' },
        },
        floatCard3: {
          '0%, 100%': { transform: 'translateX(0px)' },
          '50%': { transform: 'translateX(6px)' },
        },
        floatCard4: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        pulseShield: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.06)' },
        },
        drawPath: {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        'float-card-1': 'floatCard1 4.5s ease-in-out infinite',
        'float-card-2': 'floatCard2 5.5s ease-in-out infinite',
        'float-card-3': 'floatCard3 6s ease-in-out infinite',
        'float-card-4': 'floatCard4 7s ease-in-out infinite',
        'pulse-shield': 'pulseShield 2.5s ease-in-out infinite',
        'draw-path': 'drawPath 1.2s ease-out forwards',
      },
    },
  },
  plugins: [],
}
