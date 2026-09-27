import { useTranslation } from 'react-i18next'

const IDIOMAS = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
  { code: 'pt', label: 'PT' },
]

// Selector de idioma reutilizable (ES/EN/PT), mismo patron que el proyecto
// web (src/components/LanguageSwitcher.jsx) -- `dark` solo cambia el
// tratamiento visual para el encabezado oscuro del Login.
export default function LanguageSwitcher({ dark = false, className = '' }) {
  const { i18n, t } = useTranslation()
  const actual = i18n.resolvedLanguage || i18n.language || 'es'

  return (
    <div
      role="group"
      aria-label={t('common.language.switchLabel')}
      className={`inline-flex items-center gap-0.5 rounded-full border p-0.5 text-xs font-medium flex-shrink-0 ${dark ? 'border-white/20' : 'border-border'} ${className}`}
    >
      {IDIOMAS.map(({ code, label }) => {
        const activo = actual.startsWith(code)
        return (
          <button
            key={code}
            type="button"
            onClick={() => i18n.changeLanguage(code)}
            aria-pressed={activo}
            className={`px-2.5 py-1 rounded-full transition-colors ${
              activo
                ? dark
                  ? 'bg-white text-night'
                  : 'bg-night text-white'
                : dark
                  ? 'text-white/60 hover:text-white'
                  : 'text-secondary hover:text-ink'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
