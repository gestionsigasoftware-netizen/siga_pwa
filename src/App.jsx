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
function RouteThemeColor() {
  const location = useLocation()
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', location.pathname === '/login' ? '#0B0B0B' : '#FCFCFB')
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
