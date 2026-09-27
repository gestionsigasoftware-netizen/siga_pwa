/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // 'class' (no 'media'): el modo lo decide useTheme.jsx (localStorage +
  // arranque en prefers-color-scheme del sistema), no directamente el SO --
  // mismo patron ya usado en el proyecto web.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Apuntan a variables CSS (:root / :root.dark en index.css) en vez
        // de hex fijo, para que toda clase ya existente (bg-surface-1,
        // text-ink, border-border, etc.) responda sola al modo oscuro sin
        // tocar cada pantalla. rgb(var(--x-rgb) / <alpha-value>) es la forma
        // que Tailwind necesita para que las utilidades con opacidad
        // (bg-ink/30, shadow-ink/10, etc.) sigan funcionando.
        ink: 'rgb(var(--color-ink-rgb) / <alpha-value>)',
        surface: 'rgb(var(--color-surface-rgb) / <alpha-value>)',
        'surface-1': 'rgb(var(--color-surface-1-rgb) / <alpha-value>)',
        'surface-2': 'rgb(var(--color-surface-2-rgb) / <alpha-value>)',
        border: 'rgb(var(--color-border-rgb) / <alpha-value>)',
        muted: 'rgb(var(--color-muted-rgb) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary-rgb) / <alpha-value>)',
        accent: 'rgb(var(--color-accent-rgb) / <alpha-value>)',
        'accent-bg': 'rgb(var(--color-accent-bg-rgb) / <alpha-value>)',
        success: 'rgb(var(--color-success-rgb) / <alpha-value>)',
        'success-bg': 'rgb(var(--color-success-bg-rgb) / <alpha-value>)',
        warning: 'rgb(var(--color-warning-rgb) / <alpha-value>)',
        'warning-bg': 'rgb(var(--color-warning-bg-rgb) / <alpha-value>)',
        danger: 'rgb(var(--color-danger-rgb) / <alpha-value>)',
        'danger-bg': 'rgb(var(--color-danger-bg-rgb) / <alpha-value>)',
        // Negro fijo, igual en ambos temas -- para superficies que deben
        // verse "oscuras siempre" (encabezado del Login, botones
        // primarios, pildoras activas), a diferencia de "ink" que se
        // invierte a claro en modo oscuro por ser el color de texto
        // principal. Mismo patron que el proyecto web.
        night: 'rgb(var(--color-night-rgb) / <alpha-value>)',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
