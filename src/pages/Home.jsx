import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, ChevronRight, ShieldOff, LogOut, Wifi, WifiOff } from 'lucide-react'
import { useMisAsignaciones } from '../hooks/useMisAsignaciones'
import { useAuth } from '../hooks/useAuth'

export default function Home() {
  const { asignaciones, loading } = useMisAsignaciones()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', updateConnection)
    window.addEventListener('offline', updateConnection)
    return () => {
      window.removeEventListener('online', updateConnection)
      window.removeEventListener('offline', updateConnection)
    }
  }, [])

  useEffect(() => {
    if (!loading && asignaciones.length === 1) {
      navigate(`/captura/${asignaciones[0].id}`, { replace: true })
    }
  }, [loading, asignaciones, navigate])

  if (loading) {
    return <div className="app-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
  }

  if (asignaciones.length === 0) {
    return (
      <div className="app-screen flex flex-col items-center justify-center text-center gap-4">
        <ShieldOff className="w-12 h-12 text-muted" />
        <h2 className="text-lg font-semibold">Aún no tienes una asignación</h2>
        <p className="text-sm text-secondary max-w-xs">
          Tu cuenta todavía no tiene un módulo de registro asignado. Contacta al administrador de tu congregación para solicitar acceso.
        </p>
        <button onClick={signOut} className="text-sm text-accent underline mt-4">Cerrar sesión</button>
      </div>
    )
  }

  if (asignaciones.length === 1) return null // redirección en curso

  return (
    <div className="app-screen flex flex-col gap-6">
      <header className="app-header">
        <div className="flex items-center gap-3">
          <div className="app-mark">S</div>
          <div><p className="font-semibold tracking-wide">SIGA</p><p className="text-xs text-secondary mt-0.5">Captura móvil</p></div>
        </div>
        <div className={`status-pill ${isOnline ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'}`}>
          <span className={`status-dot ${isOnline ? 'bg-success' : 'bg-warning'}`} />
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {isOnline ? 'Conectado' : 'Sin conexión'}
        </div>
      </header>

      <div className="pt-3">
        <p className="text-xs uppercase tracking-[0.16em] text-accent font-medium">Tu jornada de hoy</p>
        <h1 className="text-2xl font-semibold mt-2">¿Qué vas a registrar?</h1>
        <p className="text-sm text-secondary mt-1">Selecciona el área que tienes asignada.</p>
      </div>

      <div className="flex flex-col gap-3">
        {asignaciones.map((a) => (
          <button
            key={a.id}
            onClick={() => navigate(`/captura/${a.id}`)}
            className="app-card flex items-center justify-between p-5 text-left active:scale-[0.98] transition-transform"
          >
            <div>
              <p className="font-medium">{a.cargos?.modulos?.nombre_modulo}</p>
              <p className="text-sm text-secondary">
                {a.cargos?.nombre_cargo}
                {a.zonas?.nombre ? ` — ${a.zonas.nombre}` : ''}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted" />
          </button>
        ))}
      </div>

      <button onClick={signOut} className="flex items-center gap-2 text-sm text-secondary mt-auto self-center py-3 px-4">
        <LogOut className="w-4 h-4" /> Cerrar sesión
      </button>
    </div>
  )
}
