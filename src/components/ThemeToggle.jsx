import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../hooks/useTheme.jsx'

// Interruptor claro/oscuro reutilizable, mismo patron del proyecto web.
// `dark` fuerza el tratamiento "sobre superficie oscura fija" (encabezado
// del Login), independiente del tema real -- sin esto, en tema claro el
// boton quedaria con texto gris sobre el fondo oscuro del encabezado,
// ilegible. En Home (superficie reactiva) se usa sin `dark`, igual que
// ThemeToggle en InicioPublico.jsx del web.
export default function ThemeToggle({ dark = false, className = '' }) {
  const { theme, toggleTheme } = useTheme()
  const { t } = useTranslation()
  const esOscuro = theme === 'dark'
  const sobreOscuro = dark || esOscuro

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t(esOscuro ? 'common.theme.toLight' : 'common.theme.toDark')}
      title={t(esOscuro ? 'common.theme.toLight' : 'common.theme.toDark')}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-full border transition-colors flex-shrink-0 ${sobreOscuro ? 'border-white/20 text-white hover:bg-white/10' : 'border-border text-secondary hover:bg-surface-1'} ${className}`}
    >
      {esOscuro ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}
