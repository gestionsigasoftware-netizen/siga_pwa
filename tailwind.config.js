/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B0B0B',
        surface: '#FCFCFB',
        'surface-1': '#F4F3F1',
        'surface-2': '#FFFFFF',
        border: '#E1E0D9',
        muted: '#898781',
        secondary: '#52514E',
        accent: '#2A78D6',
        'accent-bg': '#E6F1FB',
        success: '#008300',
        'success-bg': '#EAF3DE',
        warning: '#C98500',
        'warning-bg': '#FAEEDA',
        danger: '#D03B3B',
        'danger-bg': '#FCEBEB',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
