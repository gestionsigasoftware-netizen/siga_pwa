import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Home from './pages/Home'
import CapturaActividad from './pages/CapturaActividad'
import CapturaCarcelaria from './pages/CapturaCarcelaria'
import Estadisticas from './pages/Estadisticas'

// La barra de estado del sistema se dejó siempre clara (ver index.html):
// Android no tiene forma confiable de forzar iconos claros sobre un fondo
// oscuro (bug conocido de Chromium), asi que se prefirio uniformidad
// legible en todas las pantallas sobre continuidad visual con el
// encabezado oscuro del login.

export default function App() {
  return (
    <BrowserRouter>
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
