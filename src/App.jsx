import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Home from './pages/Home'
import CapturaActividad from './pages/CapturaActividad'
import Estadisticas from './pages/Estadisticas'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/captura/:asignacionId" element={<ProtectedRoute><CapturaActividad /></ProtectedRoute>} />
        <Route path="/estadisticas" element={<ProtectedRoute><Estadisticas /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
