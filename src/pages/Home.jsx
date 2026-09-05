import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, LogOut, Wifi, WifiOff, RefreshCw, Clock3, BarChart3, DoorOpen, Compass, BookOpen, LockKeyhole, UserPlus } from 'lucide-react'
import { useMisAsignaciones } from '../hooks/useMisAsignaciones'
import { useAuth } from '../hooks/useAuth'
import { SkeletonHome } from '../components/Skeleton'
import { getPendingCaptures, getRecentCaptures, syncPendingCaptures } from '../lib/offline'
import { registrarActividad, registrarCultoCarcelaria, registrarAmigo, registrarInterno } from '../lib/supabase'
import { MODULOS_CONOCIDOS, buscarAsignacion, esModuloObraCarcelaria } from '../lib/modulos'
import sigapLogo from '../assets/sigap-logo.svg'

const ICONOS = { ujieres: DoorOpen, evangelismo: Compass, mision_juvenil: BookOpen, obra_carcelaria: LockKeyhole }

function rutaCaptura(assignment) {
  return esModuloObraCarcelaria(assignment.cargos?.modulos?.nombre_modulo) ? 'captura-carcelaria' : 'captura'
}

export default function Home() {
  const { asignaciones, loading } = useMisAsignaciones()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(() => getPendingCaptures().length)
  const [recentCaptures, setRecentCaptures] = useState(() => getRecentCaptures())
  const [avisoSinPermiso, setAvisoSinPermiso] = useState(null)

  async function syncCaptures() {
    if (!navigator.onLine) return
    const result = await syncPendingCaptures({ actividad: registrarActividad, obra_carcelaria: registrarCultoCarcelaria, amigo: registrarAmigo, interno_carcelaria: registrarInterno })
    setPendingCount(result.pending)
    setRecentCaptures(getRecentCaptures())
  }

  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', updateConnection)
    window.addEventListener('offline', updateConnection)
    window.addEventListener('online', syncCaptures)
    syncCaptures()
    return () => {
      window.removeEventListener('online', updateConnection)
      window.removeEventListener('offline', updateConnection)
      window.removeEventListener('online', syncCaptures)
    }
  }, [])

  useEffect(() => {
    if (!avisoSinPermiso) return undefined
    const timer = setTimeout(() => setAvisoSinPermiso(null), 4500)
    return () => clearTimeout(timer)
  }, [avisoSinPermiso])

  function elegirModulo(modulo) {
    const assignment = buscarAsignacion(asignaciones, modulo)
    if (!assignment) { setAvisoSinPermiso(modulo.nombre); return }
    setAvisoSinPermiso(null)
    navigate(`/${rutaCaptura(assignment)}/${assignment.id}`)
  }

  if (loading) return <div className="app-shell"><div className="app-screen"><SkeletonHome /></div></div>

  return <div className="app-shell"><div className="app-screen flex flex-col gap-6">
    <header className="app-header">
      <div className="flex items-center gap-3"><img src={sigapLogo} alt="SIGAP" className="h-6 w-auto" /><span className="w-px h-6 bg-border" /><p className="text-sm text-secondary">Captura móvil</p></div>
      <div className={`status-pill ${isOnline ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'}`}><span className={`status-dot ${isOnline ? 'bg-success' : 'bg-warning'}`} />{isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}{isOnline ? 'Conectado' : 'Sin conexión'}</div>
    </header>
    {pendingCount > 0 && <div className="app-card flex items-center gap-3 p-4 border-warning/40 bg-warning-bg"><RefreshCw className="w-5 h-5 text-warning flex-shrink-0" /><div><p className="text-sm font-medium text-warning">{pendingCount} registro{pendingCount > 1 ? 's' : ''} pendiente{pendingCount > 1 ? 's' : ''}</p><p className="text-xs text-secondary mt-0.5">Se enviará{pendingCount > 1 ? 'n' : ''} automáticamente al recuperar la conexión.</p></div></div>}
    <div className="pt-3"><p className="text-xs uppercase tracking-[0.16em] text-accent font-medium">{asignaciones[0]?.cargos?.modulos?.congregaciones?.nombre || 'Tu congregación'}</p><h1 className="text-2xl font-semibold mt-2">¿Qué vas a registrar?</h1><p className="text-sm text-secondary mt-1">Selecciona el área que necesitas registrar.</p></div>
    {avisoSinPermiso && <p role="alert" className="text-sm text-danger bg-danger-bg rounded-xl p-3">No tienes permisos para {avisoSinPermiso}. Contacta al pastor de tu congregación para solicitar acceso.</p>}
    <div className="flex flex-col gap-3">{MODULOS_CONOCIDOS.map((modulo) => {
      const Icono = ICONOS[modulo.id]
      const assignment = buscarAsignacion(asignaciones, modulo)
      const asignado = Boolean(assignment)
      const permiteAmigos = asignado && Boolean(assignment.cargos?.modulos?.requiere_zona)
      const permiteInternos = asignado && esModuloObraCarcelaria(assignment.cargos?.modulos?.nombre_modulo)
      return <div key={modulo.id} className={`app-card overflow-hidden ${asignado ? '' : 'opacity-60'}`}>
        <button onClick={() => elegirModulo(modulo)} className="w-full flex items-center justify-between p-5 text-left active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-surface-1 flex items-center justify-center text-accent flex-shrink-0"><Icono className="w-5 h-5" /></div>
            <div className="min-w-0"><p className="font-medium truncate">{modulo.nombre}</p><p className="text-sm text-secondary">{asignado ? 'Acceso habilitado' : 'Sin acceso asignado'}</p></div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted flex-shrink-0" />
        </button>
        {permiteAmigos && <button onClick={() => navigate(`/captura-amigo/${assignment.id}`)} className="w-full flex items-center gap-2 px-5 py-3 text-sm font-medium text-accent border-t border-border active:scale-[0.98] transition-transform"><UserPlus className="w-4 h-4" /> Registrar amigo nuevo</button>}
        {permiteInternos && <button onClick={() => navigate(`/captura-interno/${assignment.id}`)} className="w-full flex items-center gap-2 px-5 py-3 text-sm font-medium text-accent border-t border-border active:scale-[0.98] transition-transform"><UserPlus className="w-4 h-4" /> Registrar interno nuevo</button>}
      </div>
    })}</div>
    <button onClick={() => navigate('/estadisticas')} className="app-card flex items-center justify-center gap-2 p-4 text-sm font-medium text-accent active:scale-[0.98] transition-transform"><BarChart3 className="w-4 h-4" /> Ver mis estadísticas</button>
    {recentCaptures.length > 0 && <section><div className="flex items-center gap-2 mb-3"><Clock3 className="w-4 h-4 text-accent" /><h2 className="text-sm font-medium">Registros recientes</h2></div><div className="app-card divide-y divide-border">{recentCaptures.slice(0, 4).map((capture) => <div key={capture.id} className="p-3 flex items-center justify-between gap-3"><span className="text-sm text-secondary truncate">{capture.label}</span><span className="text-xs text-success flex-shrink-0">Sincronizado</span></div>)}</div></section>}
    <button onClick={signOut} className="flex items-center gap-2 text-sm text-secondary mt-auto self-center py-3 px-4"><LogOut className="w-4 h-4" /> Cerrar sesión</button>
  </div></div>
}
