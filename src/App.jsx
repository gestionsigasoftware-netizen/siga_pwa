import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Home from './pages/Home'
import CapturaActividad from './pages/CapturaActividad'
import CapturaCarcelaria from './pages/CapturaCarcelaria'
import Estadisticas from './pages/Estadisticas'

// La barra de estado del sistema toma el color de <meta name="theme-color">.
// Login tiene un encabezado oscuro (bg-ink); el resto de pantallas son
// claras (bg-surface) -- sin esto, la barra queda negra siempre y se ve
// mal encima de las pantallas claras.
//
// El FONDO de la barra es una cosa; el color de sus iconos (hora, batería,
// señal) es otra. En Android eso se calcula solo a partir de theme-color
// (entre más oscuro, iconos claros) -- si en un dispositivo real se ven
// oscuros sobre un fondo oscuro, casi siempre es porque el ícono de la app
// instalada quedó generado con una version anterior del sitio; toca
// desinstalarla y volver a "Agregar a pantalla de inicio". En iOS ese color
// de iconos sí se controla aparte, con apple-mobile-web-app-status-bar-style
// ("black-translucent" = iconos claros, "default" = iconos oscuros).
function RouteThemeColor() {
  const location = useLocation()
  useEffect(() => {
    const oscuro = location.pathname === '/login'
    const themeColor = document.querySelector('meta[name="theme-color"]')
    if (themeColor) themeColor.setAttribute('content', oscuro ? '#0B0B0B' : '#FCFCFB')
    const iosStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
    if (iosStatusBar) iosStatusBar.setAttribute('content', oscuro ? 'black-translucent' : 'default')
  }, [location.pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteThemeColor />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/captura/:asignacionId" element={<ProtectedRoute><CapturaActividad /></ProtectedRoute>} />
        <Route path="/captura-carcelaria/:asignacionId" element={<ProtectedRoute><CapturaCarcelaria /></ProtectedRoute>} />
        <Route path="/estadisticas" element={<ProtectedRoute><Estadisticas /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
