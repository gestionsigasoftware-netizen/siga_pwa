import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return <div className="app-shell"><div className="app-screen flex flex-col items-center justify-center text-center gap-4">
    <div className="w-14 h-14 rounded-xl bg-surface-2 border border-border text-accent flex items-center justify-center"><Compass className="w-6 h-6" /></div>
    <h1 className="text-lg font-semibold">Página no encontrada</h1>
    <p className="text-sm text-secondary">Esta dirección no existe en la app. Vuelve al inicio.</p>
    <Link to="/" className="btn-primary mt-2 max-w-xs">Ir al inicio</Link>
  </div></div>
}
