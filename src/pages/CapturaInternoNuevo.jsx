import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CalendarDays, CheckCircle2, Loader2, Wifi } from 'lucide-react'
import { useMisAsignaciones } from '../hooks/useMisAsignaciones'
import { getCentrosReclusion, registrarInterno } from '../lib/supabase'
import { queueCapture, rememberCapture } from '../lib/offline'
import { SkeletonForm } from '../components/Skeleton'

const CAMPOS_VACIOS = { nombres: '', apellidos: '', patio: '', observaciones: '' }

export default function CapturaInternoNuevo() {
  const { asignacionId } = useParams()
  const navigate = useNavigate()
  const { asignaciones, loading: loadingAsig } = useMisAsignaciones()
  const [asignacion, setAsignacion] = useState(null)
  const [centros, setCentros] = useState([])
  const [centroId, setCentroId] = useState('')
  const [loadingDetalle, setLoadingDetalle] = useState(true)
  const [campos, setCampos] = useState(CAMPOS_VACIOS)
  const [fecha, setFecha] = useState(() => new Date().toLocaleDateString('en-CA'))
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [savedOffline, setSavedOffline] = useState(false)
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
    if (!campos.nombres.trim() || !campos.apellidos.trim()) { setError('Escribe el nombre y apellido del interno.'); return }
    setError(null)
    const payload = {
      congregacionId: modulo.congregacion_id,
      centroId: centroId || null,
      nombres: campos.nombres.trim(),
      apellidos: campos.apellidos.trim(),
      patio: campos.patio.trim(),
      fechaIngresoMinisterio: fecha,
      observaciones: campos.observaciones.trim(),
    }
    setSaving(true)
    if (!navigator.onLine) {
      queueCapture(payload, `Interno nuevo · ${payload.nombres} ${payload.apellidos}`, 'interno_carcelaria')
      setSaving(false)
      setSavedOffline(true)
      setSuccess(true)
      return
    }
    const { error: saveError } = await registrarInterno(payload)
    setSaving(false)
    if (saveError) { setError('No se pudo guardar: ' + saveError.message); return }
    rememberCapture({ label: `Interno nuevo · ${payload.nombres} ${payload.apellidos}`, payload, createdAt: new Date().toISOString() })
    setSavedOffline(false)
    setSuccess(true)
  }

  if (success) return <div className="app-shell"><div className="app-screen flex flex-col items-center justify-center text-center gap-4"><CheckCircle2 className="w-16 h-16 text-success" /><h2 className="text-lg font-semibold">{savedOffline ? 'Interno guardado en el dispositivo' : 'Interno registrado'}</h2><p className="text-sm text-secondary">{savedOffline ? 'Se enviará automáticamente cuando vuelva la conexión.' : 'Ya está disponible en Obra Carcelaria de tu congregación.'}</p><button onClick={() => { setSuccess(false); setCampos(CAMPOS_VACIOS); setFecha(new Date().toLocaleDateString('en-CA')) }} className="btn-primary mt-4 max-w-xs">Registrar otro interno</button><button onClick={() => navigate('/')} className="text-accent underline text-sm">Volver al inicio</button></div></div>

  return <div className="app-shell"><div className="app-screen flex flex-col gap-6 pb-16">
    <div className="app-header">
      <div className="flex items-center gap-3 min-w-0">
        <button aria-label="Volver a módulos" onClick={() => navigate('/')} className="w-11 h-11 flex-shrink-0 rounded-xl bg-surface-2 border border-border text-secondary flex items-center justify-center active:scale-[0.96] transition-transform"><ArrowLeft className="w-5 h-5" /></button>
        <div className="min-w-0"><p className="text-[11px] uppercase tracking-[0.08em] text-accent font-medium whitespace-nowrap">Interno nuevo</p><h1 className="text-lg font-semibold truncate mt-1">{modulo?.nombre_modulo}</h1><p className="text-sm text-secondary truncate">{modulo?.congregaciones?.nombre || 'Congregación sin nombre'}</p></div>
      </div>
      <Wifi className="w-4 h-4 text-success flex-shrink-0" aria-label="Conectado" />
    </div>
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div><label className="text-sm font-medium block mb-1.5">Nombres</label><input required minLength={2} value={campos.nombres} onChange={(e) => setCampos({ ...campos, nombres: e.target.value })} className="input-field" placeholder="Ej: Pepito" /></div>
      <div><label className="text-sm font-medium block mb-1.5">Apellidos</label><input required minLength={2} value={campos.apellidos} onChange={(e) => setCampos({ ...campos, apellidos: e.target.value })} className="input-field" placeholder="Ej: Pérez" /></div>
      <div><label className="text-sm font-medium block mb-1.5">Centro de reclusión <span className="text-xs text-muted">(opcional)</span></label><select value={centroId} onChange={(e) => setCentroId(e.target.value)} className="input-field"><option value="">Seleccionar centro...</option>{centros.map((c) => <option key={c.id} value={c.id}>{c.nombre}{c.ciudad ? ` — ${c.ciudad}` : ''}</option>)}</select></div>
      <div><label className="text-sm font-medium block mb-1.5">Patio <span className="text-xs text-muted">(opcional)</span></label><input value={campos.patio} onChange={(e) => setCampos({ ...campos, patio: e.target.value })} className="input-field" placeholder="Ej: Patio 3" /></div>
      <div><label htmlFor="fecha-ingreso-interno" className="text-sm font-medium block mb-1.5">Fecha en que se entregó</label><div className="relative"><CalendarDays className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2" /><input id="fecha-ingreso-interno" type="date" max={new Date().toLocaleDateString('en-CA')} value={fecha} onChange={(e) => setFecha(e.target.value)} className="input-field pl-11" /></div></div>
      <div><label className="text-sm font-medium block mb-1.5">Observaciones <span className="text-xs text-muted">(opcional)</span></label><textarea value={campos.observaciones} onChange={(e) => setCampos({ ...campos, observaciones: e.target.value })} rows={2} className="input-field" placeholder="Sin novedades" /></div>
      {error && <p className="text-sm text-danger text-center">{error}</p>}
      <button type="submit" disabled={saving} className="btn-primary flex items-center justify-center gap-2 py-4 shadow-lg shadow-ink/10">{saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar interno'}</button>
    </form>
  </div></div>
}
