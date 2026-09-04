import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CalendarDays, CheckCircle2, Loader2, Wifi } from 'lucide-react'
import { useMisAsignaciones } from '../hooks/useMisAsignaciones'
import { getTiposActividad, registrarAmigo } from '../lib/supabase'
import { queueCapture, rememberCapture } from '../lib/offline'
import { SkeletonForm } from '../components/Skeleton'

const CAMPOS_VACIOS = { nombres: '', telefono: '', direccion: '', sector: '', invitadoPor: '', metodologiaId: '' }

export default function CapturaAmigo() {
  const { asignacionId } = useParams()
  const navigate = useNavigate()
  const { asignaciones, loading: loadingAsig } = useMisAsignaciones()
  const [asignacion, setAsignacion] = useState(null)
  const [metodologias, setMetodologias] = useState([])
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
  const esEvangelismo = /evangel/i.test(modulo?.nombre_modulo || '')

  useEffect(() => {
    if (!modulo) return
    let active = true
    setLoadingDetalle(true)
    Promise.resolve(esEvangelismo ? getTiposActividad(modulo.id) : { data: [] }).then((res) => {
      if (!active) return
      setMetodologias(res.data ?? [])
      setLoadingDetalle(false)
    })
    return () => { active = false }
  }, [modulo, esEvangelismo])

  if (loadingAsig || (asignacion && loadingDetalle)) return <div className="app-shell"><div className="app-screen"><SkeletonForm /></div></div>

  if (!asignacion) return <div className="app-shell"><div className="app-screen flex flex-col items-center justify-center text-center gap-3"><p className="text-secondary">No tienes acceso a este módulo.</p><button onClick={() => navigate('/')} className="text-accent underline text-sm">Volver</button></div></div>

  if (!asignacion.zona_id) return <div className="app-shell"><div className="app-screen flex flex-col items-center justify-center text-center gap-3 px-6"><p className="text-secondary">Tu cargo todavía no tiene una zona asignada. Pide al pastor de tu congregación que te la asigne desde "Equipo de trabajo" antes de registrar amigos.</p><button onClick={() => navigate('/')} className="text-accent underline text-sm">Volver</button></div></div>

  async function handleSubmit(e) {
    e.preventDefault()
    if (!campos.nombres.trim()) { setError('Escribe el nombre del amigo.'); return }
    setError(null)
    const payload = {
      congregacionId: modulo.congregacion_id,
      zonaId: asignacion.zona_id,
      nombres: campos.nombres.trim(),
      telefono: campos.telefono.trim(),
      direccion: campos.direccion.trim(),
      sector: campos.sector.trim(),
      invitadoPor: campos.invitadoPor.trim(),
      fechaPrimerContacto: fecha,
      evangelismoMetodologiaId: campos.metodologiaId || null,
    }
    setSaving(true)
    if (!navigator.onLine) {
      queueCapture(payload, `Amigo nuevo · ${payload.nombres}`, 'amigo')
      setSaving(false)
      setSavedOffline(true)
      setSuccess(true)
      return
    }
    const { error: saveError } = await registrarAmigo(payload)
    setSaving(false)
    if (saveError) { setError('No se pudo guardar: ' + saveError.message); return }
    rememberCapture({ label: `Amigo nuevo · ${payload.nombres}`, payload, createdAt: new Date().toISOString() })
    setSavedOffline(false)
    setSuccess(true)
  }

  if (success) return <div className="app-shell"><div className="app-screen flex flex-col items-center justify-center text-center gap-4"><CheckCircle2 className="w-16 h-16 text-success" /><h2 className="text-lg font-semibold">{savedOffline ? 'Amigo guardado en el dispositivo' : 'Amigo registrado'}</h2><p className="text-sm text-secondary">{savedOffline ? 'Se enviará automáticamente cuando vuelva la conexión.' : 'Ya está disponible en la ruta de seguimiento de tu congregación.'}</p><button onClick={() => { setSuccess(false); setCampos(CAMPOS_VACIOS); setFecha(new Date().toLocaleDateString('en-CA')) }} className="btn-primary mt-4 max-w-xs">Registrar otro amigo</button><button onClick={() => navigate('/')} className="text-accent underline text-sm">Volver al inicio</button></div></div>

  return <div className="app-shell"><div className="app-screen flex flex-col gap-6 pb-16">
    <div className="app-header">
      <div className="flex items-center gap-3 min-w-0">
        <button aria-label="Volver a módulos" onClick={() => navigate('/')} className="w-11 h-11 flex-shrink-0 rounded-xl bg-surface-2 border border-border text-secondary flex items-center justify-center active:scale-[0.96] transition-transform"><ArrowLeft className="w-5 h-5" /></button>
        <div className="min-w-0"><p className="text-[11px] uppercase tracking-[0.08em] text-accent font-medium whitespace-nowrap">Amigo nuevo</p><h1 className="text-lg font-semibold truncate mt-1">{modulo?.nombre_modulo}</h1><p className="text-sm text-secondary truncate">{modulo?.congregaciones?.nombre || 'Congregación sin nombre'}</p><p className="text-xs text-muted truncate">Acceso habilitado{asignacion.zonas?.nombre ? ` — ${asignacion.zonas.nombre}` : ''}</p></div>
      </div>
      <Wifi className="w-4 h-4 text-success flex-shrink-0" aria-label="Conectado" />
    </div>
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div><label className="text-sm font-medium block mb-1.5">Nombre completo</label><input required minLength={3} value={campos.nombres} onChange={(e) => setCampos({ ...campos, nombres: e.target.value })} className="input-field" placeholder="Ej: Pepito Pérez" /></div>
      <div><label className="text-sm font-medium block mb-1.5">Teléfono <span className="text-xs text-muted">(opcional)</span></label><input type="tel" value={campos.telefono} onChange={(e) => setCampos({ ...campos, telefono: e.target.value })} className="input-field" placeholder="Ej: 3001234567" /></div>
      <div><label className="text-sm font-medium block mb-1.5">Dirección <span className="text-xs text-muted">(opcional)</span></label><input value={campos.direccion} onChange={(e) => setCampos({ ...campos, direccion: e.target.value })} className="input-field" placeholder="Ej: Cra 5 # 10-20" /></div>
      <div><label className="text-sm font-medium block mb-1.5">Sector <span className="text-xs text-muted">(opcional)</span></label><input value={campos.sector} onChange={(e) => setCampos({ ...campos, sector: e.target.value })} className="input-field" placeholder="Ej: Barrio La Esperanza" /></div>
      <div><label className="text-sm font-medium block mb-1.5">Invitado por <span className="text-xs text-muted">(opcional)</span></label><input value={campos.invitadoPor} onChange={(e) => setCampos({ ...campos, invitadoPor: e.target.value })} className="input-field" placeholder="Ej: Juan Pérez" /></div>
      {esEvangelismo && metodologias.length > 0 && <div><label className="text-sm font-medium block mb-1.5">Metodología <span className="text-xs text-muted">(opcional)</span></label><select value={campos.metodologiaId} onChange={(e) => setCampos({ ...campos, metodologiaId: e.target.value })} className="input-field"><option value="">Sin especificar</option>{metodologias.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}</select></div>}
      <div><label htmlFor="fecha-contacto" className="text-sm font-medium block mb-1.5">Fecha de primer contacto</label><div className="relative"><CalendarDays className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2" /><input id="fecha-contacto" type="date" max={new Date().toLocaleDateString('en-CA')} value={fecha} onChange={(e) => setFecha(e.target.value)} className="input-field pl-11" /></div></div>
      {error && <p className="text-sm text-danger text-center">{error}</p>}
      <button type="submit" disabled={saving} className="btn-primary flex items-center justify-center gap-2 py-4 shadow-lg shadow-ink/10">{saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar amigo'}</button>
    </form>
  </div></div>
}
