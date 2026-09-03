import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return <div className="app-shell"><div className="app-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div></div>
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}
