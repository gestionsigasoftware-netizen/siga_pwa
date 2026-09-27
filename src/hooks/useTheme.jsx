import { createContext, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'sigap:theme'

function temaInicial() {
  if (typeof window === 'undefined') return 'light'
  const guardado = localStorage.getItem(STORAGE_KEY)
  if (guardado === 'light' || guardado === 'dark') return guardado
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const ThemeContext = createContext(null)

// Mismo patron exacto del proyecto web (src/hooks/useTheme.jsx) -- Context
// (no useState local) para que Home/Login/ThemeToggle compartan el mismo
// valor, aplicando la clase `dark` en <html> (Tailwind darkMode: 'class').
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(temaInicial)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  function toggleTheme() {
    setTheme((actual) => (actual === 'dark' ? 'light' : 'dark'))
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme debe usarse dentro de <ThemeProvider>')
  return context
}
