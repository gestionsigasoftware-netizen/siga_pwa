import { Link } from 'react-router-dom'
import EmptyStreetIllustration from '../components/illustrations/EmptyStreetIllustration'

export default function NotFound() {
  return <div className="app-shell"><div className="app-screen flex flex-col items-center justify-center text-center gap-4">
    <EmptyStreetIllustration className="w-56 h-auto" />
    <h1 className="text-lg font-semibold">Página no encontrada</h1>
    <p className="text-sm text-secondary">Esta dirección no existe en la app. Vuelve al inicio.</p>
    <Link to="/" className="btn-primary mt-2 max-w-xs">Ir al inicio</Link>
  </div></div>
}
