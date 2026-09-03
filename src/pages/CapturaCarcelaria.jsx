import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, BarChart3, CalendarDays, CheckCircle2, Loader2, Wifi } from 'lucide-react'
import { useMisAsignaciones } from '../hooks/useMisAsignaciones'
import { getCentrosReclusion, registrarCultoCarcelaria } from '../lib/supabase'
import { hasPendingCultoCarcelaria, queueCapture, rememberCapture } from '../lib/offline'
import { SkeletonForm } from '../components/Skeleton'

export default function CapturaCarcelaria() {
  const { asignacionId } = useParams()
  const navigate = useNavigate()
  const { asignaciones, loading: loadingAsig } = useMisAsignaciones()
  const [asignacion, setAsignacion] = useState(null)
  const [centros, setCentros] = useState([])
  const [loadingDetalle, setLoadingDetalle] = useState(true)
  const [centroId, setCentroId] = useState('')
  const [patio, setPatio] = useState('')
  const [fecha, setFecha] = useState(() => new Date().toLocaleDateString('en-CA'))
  const [asistentesTotal, setAsistentesTotal] = useState('')
  const [estudios, setEstudios] = useState('')
  const [notas, setNotas] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [savedOffline, setSavedOffline] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!loadingAsig) setAsignacion(asignaciones.find((a) => a.id === asignacionId) ?? null)
  }, [loadingAsig, asignaciones, asignacionId])

  const modulo = asignacion?.cargos?.modulos

  useEffect(() => {
    if (!modulo) return
    let active = true
    setLoadingDetalle(true)
    getCentrosReclusion(modulo.congregacion_id).then(({ data, error: loadError }) => {
      if (!active) return
      if (loadError) setError('No se pudieron cargar los centros de reclusión. Verifica tu conexión e intenta de nuevo.')
      setCentros(data ?? [])
      setLoadingDetalle(false)
    })
    return () => { active = false }
  }, [modulo])

  if (loadingAsig || (asignacion && loadingDetalle)) return <div className="app-shell"><div className="app-screen"><SkeletonForm /></div></div>

  if (!asignacion) return <div className="app-shell"><div className="app-screen flex flex-col items-center justify-center text-center gap-3"><p className="text-secondary">No tienes acceso a este módulo.</p><button onClick={() => navigate('/')} className="text-accent underline text-sm">Volver</button></div></div>

  async function handleSubmit(e) {
    e.preventDefault()
    const total = parseInt(asistentesTotal, 10) || 0
    if (!fecha || total <= 0) { setError('Completa la fecha y el número de asistentes.'); return }
    setError(null)
    if (hasPendingCultoCarcelaria({ centroId: centroId || null, fecha, patio: patio.trim() })) {
      setError('Ya tienes este registro pendiente de sincronizar en el dispositivo.')
      return
    }
    setConfirming(true)
  }

  async function confirmSave() {
    setConfirming(false)
    setSaving(true)
    const total = parseInt(asistentesTotal, 10) || 0
    const payload = {
      congregacionId: modulo.congregacion_id,
      centroId: centroId || null,
      fecha,
      patio: patio.trim(),
      asistentesTotal: total,
      estudiosBiblicosEntregados: parseInt(estudios, 10) || 0,
      notas,
    }
    if (!navigator.onLine) {
      queueCapture(payload, `${modulo.nombre_modulo} · ${total} asistentes`, 'obra_carcelaria')
      setSaving(false)
      setSavedOffline(true)
      setSuccess(true)
      return
    }
    const { error: saveError } = await registrarCultoCarcelaria(payload)
    setSaving(false)
    if (saveError) { setError('No se pudo guardar: ' + saveError.message); return }
    rememberCapture({ label: `${modulo.nombre_modulo} · ${total} asistentes`, tipo: 'obra_carcelaria', payload, createdAt: new Date().toISOString() })
    setSavedOffline(false)
    setSuccess(true)
  }

  if (success) return <div className="app-shell"><div className="app-screen flex flex-col items-center justify-center text-center gap-4"><CheckCircle2 className="w-16 h-16 text-success" /><h2 className="text-lg font-semibold">{savedOffline ? 'Registro guardado en el dispositivo' : 'Registro sincronizado'}</h2><p className="text-sm text-secondary">{savedOffline ? 'Se enviará automáticamente cuando vuelva la conexión.' : 'Tu registro ya está disponible para la congregación.'}</p><button onClick={() => { setSuccess(false); setCentroId(''); setPatio(''); setAsistentesTotal(''); setEstudios(''); setNotas(''); setFecha(new Date().toLocaleDateString('en-CA')) }} className="btn-primary mt-4 max-w-xs">Registrar otro</button></div></div>

  return <div className="app-shell"><div className="app-screen flex flex-col gap-6 pb-16">
    <div className="app-header">
      <div className="flex items-center gap-3 min-w-0">
        <button aria-label="Volver a módulos" onClick={() => navigate('/')} className="w-11 h-11 flex-shrink-0 rounded-xl bg-surface-2 border border-border text-secondary flex items-center justify-center active:scale-[0.96] transition-transform"><ArrowLeft className="w-5 h-5" /></button>
        <div className="min-w-0"><p className="text-[11px] uppercase tracking-[0.08em] text-accent font-medium whitespace-nowrap">Registro carcelario</p><h1 className="text-lg font-semibold truncate mt-1">{modulo?.nombre_modulo}</h1><p className="text-sm text-secondary truncate">{modulo?.congregaciones?.nombre || 'Congregación sin nombre'}</p><p className="text-xs text-muted truncate">Acceso habilitado</p></div>
      </div>
      <div className="flex items-center gap-3"><button aria-label="Ver estadísticas" onClick={() => navigate('/estadisticas')} className="w-10 h-10 rounded-xl bg-surface-2 border border-border text-accent flex items-center justify-center"><BarChart3 className="w-4 h-4" /></button><Wifi className="w-4 h-4 text-success flex-shrink-0" aria-label="Conectado" /></div>
    </div>
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div><label className="text-sm font-medium block mb-1.5">Centro de reclusión</label><select value={centroId} onChange={(e) => setCentroId(e.target.value)} className="input-field"><option value="">Seleccionar centro...</option>{centros.map((c) => <option key={c.id} value={c.id}>{c.nombre}{c.ciudad ? ` — ${c.ciudad}` : ''}</option>)}</select></div>
      <div><label className="text-sm font-medium block mb-1.5">Patio</label><input value={patio} onChange={(e) => setPatio(e.target.value)} className="input-field" placeholder="Ej. Patio 3 (opcional)" /></div>
      <div><label htmlFor="fecha-culto-carcelaria" className="text-sm font-medium block mb-1.5">Fecha del culto</label><div className="relative"><CalendarDays className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2" /><input id="fecha-culto-carcelaria" type="date" max={new Date().toLocaleDateString('en-CA')} value={fecha} onChange={(e) => setFecha(e.target.value)} className="input-field pl-11" /></div></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-secondary block mb-1">Asistentes</label><input type="number" min="0" inputMode="numeric" value={asistentesTotal} onChange={(e) => setAsistentesTotal(e.target.value)} className="input-field text-center" placeholder="0" /></div>
        <div><label className="text-xs text-secondary block mb-1">Estudios entregados</label><input type="number" min="0" inputMode="numeric" value={estudios} onChange={(e) => setEstudios(e.target.value)} className="input-field text-center" placeholder="0" /></div>
      </div>
      <div><label className="text-sm font-medium block mb-1.5">Notas</label><textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} className="input-field" placeholder="Sin novedades" /></div>
      {error && <p className="text-sm text-danger text-center">{error}</p>}
      <button type="submit" disabled={saving} className="btn-primary flex items-center justify-center gap-2 py-4 shadow-lg shadow-ink/10">{saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar registro'}</button>
    </form>
    {confirming && <div className="fixed inset-0 z-10 flex items-end sm:items-center justify-center bg-ink/30 p-4"><div className="app-card w-full max-w-md p-5"><h2 className="text-lg font-semibold">Confirma el registro</h2><p className="text-sm text-secondary mt-1">Revisa los datos antes de guardar.</p><div className="bg-surface-1 rounded-xl p-4 mt-4 space-y-2 text-sm"><div className="flex justify-between gap-3"><span className="text-secondary">Centro</span><span className="font-medium text-right">{centros.find((c) => c.id === centroId)?.nombre || 'Sin especificar'}</span></div><div className="flex justify-between gap-3"><span className="text-secondary">Congregación</span><span className="font-medium text-right">{modulo?.congregaciones?.nombre}</span></div><div className="flex justify-between gap-3"><span className="text-secondary">Fecha</span><span className="font-medium">{fecha}</span></div><div className="flex justify-between gap-3"><span className="text-secondary">Asistentes</span><span className="font-semibold text-accent">{parseInt(asistentesTotal, 10) || 0}</span></div></div><div className="grid grid-cols-2 gap-3 mt-5"><button type="button" onClick={() => setConfirming(false)} className="btn-secondary">Volver a editar</button><button type="button" onClick={confirmSave} className="btn-primary">Confirmar</button></div></div></div>}
  </div></div>
}
