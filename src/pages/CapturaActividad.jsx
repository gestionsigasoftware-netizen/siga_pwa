import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, BarChart3, CalendarDays, CheckCircle2, Loader2, Wifi } from 'lucide-react'
import { useMisAsignaciones } from '../hooks/useMisAsignaciones'
import { findDuplicateActivity, getCategorias, getTiposActividad, registrarActividad } from '../lib/supabase'
import { hasPendingCapture, queueCapture, rememberCapture } from '../lib/offline'

export default function CapturaActividad() {
  const { asignacionId } = useParams()
  const navigate = useNavigate()
  const { asignaciones, loading: loadingAsig } = useMisAsignaciones()
  const [asignacion, setAsignacion] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [tipos, setTipos] = useState([])
  const [tipoId, setTipoId] = useState('')
  const [nombreActividad, setNombreActividad] = useState('')
  const [fecha, setFecha] = useState(() => new Date().toLocaleDateString('en-CA'))
  const [desglose, setDesglose] = useState({})
  const [novedades, setNovedades] = useState('')
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
    getCategorias(modulo.congregacion_id).then(({ data }) => setCategorias(data ?? []))
    getTiposActividad(modulo.id).then(({ data }) => setTipos(data ?? []))
  }, [modulo])

  if (loadingAsig) return <div className="app-shell"><div className="app-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div></div>

  if (!asignacion) return <div className="app-shell"><div className="app-screen flex flex-col items-center justify-center text-center gap-3"><p className="text-secondary">No tienes acceso a este módulo.</p><button onClick={() => navigate('/')} className="text-accent underline text-sm">Volver</button></div></div>

  function actualizar(catId, valor) {
    setDesglose((prev) => ({ ...prev, [catId]: parseInt(valor, 10) || 0 }))
  }

  const total = Object.values(desglose).reduce((a, b) => a + b, 0)

  async function handleSubmit(e) {
    e.preventDefault()
    if ((!tipoId && !nombreActividad.trim()) || total <= 0 || !fecha) { setError('Completa el culto, la fecha y registra al menos un asistente.'); return }
    setError(null)
    if (hasPendingCapture({ moduloId: modulo.id, tipoActividadId: tipoId, nombreActividad: nombreActividad.trim(), zonaId: asignacion.zona_id, fecha })) {
      setError('Ya tienes este registro pendiente de sincronizar en el dispositivo.')
      return
    }
    if (navigator.onLine) {
      const { data: duplicate, error: duplicateError } = await findDuplicateActivity({ moduloId: modulo.id, tipoActividadId: tipoId, nombreActividad: nombreActividad.trim(), zonaId: asignacion.zona_id, fecha })
      if (duplicateError) { setError('No se pudo verificar si ya existe un registro.'); return }
      if (duplicate) { setError('Ya existe un registro para esta actividad, fecha y zona.'); return }
    }
    setConfirming(true)
  }

  async function confirmSave() {
    setConfirming(false)
    setSaving(true)
    const payload = {
      congregacionId: modulo.congregacion_id,
      moduloId: modulo.id,
      tipoActividadId: tipoId === '__otro__' ? null : tipoId,
      nombreActividad: tipoId === '__otro__' ? nombreActividad.trim() : null,
      zonaId: asignacion.zona_id,
      responsablePersonaId: null,
      fecha,
      desglose,
      novedades,
    }
    if (!navigator.onLine) {
      queueCapture(payload, `${modulo.nombre_modulo} · ${total} asistentes`)
      setSaving(false)
      setSavedOffline(true)
      setSuccess(true)
      return
    }
    const { error: saveError } = await registrarActividad(payload)
    setSaving(false)
    if (saveError) { setError('No se pudo guardar: ' + saveError.message); return }
    rememberCapture({ label: `${modulo.nombre_modulo} · ${total} asistentes`, payload, createdAt: new Date().toISOString() })
    setSavedOffline(false)
    setSuccess(true)
  }

  if (success) return <div className="app-shell"><div className="app-screen flex flex-col items-center justify-center text-center gap-4"><CheckCircle2 className="w-16 h-16 text-success" /><h2 className="text-lg font-semibold">{savedOffline ? 'Registro guardado en el dispositivo' : 'Registro sincronizado'}</h2><p className="text-sm text-secondary">{savedOffline ? 'Se enviará automáticamente cuando vuelva la conexión.' : 'Tu asistencia ya está disponible para la congregación.'}</p><button onClick={() => { setSuccess(false); setDesglose({}); setNovedades(''); setTipoId(''); setNombreActividad(''); setFecha(new Date().toLocaleDateString('en-CA')) }} className="btn-primary mt-4 max-w-xs">Registrar otra</button></div></div>

  return <div className="app-shell"><div className="app-screen flex flex-col gap-6 pb-16">
    <div className="app-header">
      <div className="flex items-center gap-3 min-w-0">
        <button aria-label="Volver a módulos" onClick={() => navigate('/')} className="w-11 h-11 flex-shrink-0 rounded-xl bg-surface-2 border border-border text-secondary flex items-center justify-center active:scale-[0.96] transition-transform"><ArrowLeft className="w-5 h-5" /></button>
        <div className="min-w-0"><p className="text-xs uppercase tracking-[0.14em] text-accent font-medium">Registro de asistencia</p><h1 className="text-lg font-semibold truncate mt-1">{modulo?.nombre_modulo}</h1><p className="text-sm text-secondary truncate">{modulo?.congregaciones?.nombre || 'Congregación sin nombre'}</p><p className="text-xs text-muted truncate">{asignacion.cargos?.nombre_cargo}{asignacion.zonas?.nombre ? ` — ${asignacion.zonas.nombre}` : ''}</p></div>
      </div>
      <div className="flex items-center gap-3"><button aria-label="Ver estadísticas" onClick={() => navigate('/estadisticas')} className="w-10 h-10 rounded-xl bg-surface-2 border border-border text-accent flex items-center justify-center"><BarChart3 className="w-4 h-4" /></button><Wifi className="w-4 h-4 text-success flex-shrink-0" aria-label="Conectado" /></div>
    </div>
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div><label className="text-sm font-medium block mb-1.5">¿Qué culto registras?</label><select value={tipoId} onChange={(e) => { setTipoId(e.target.value); if (e.target.value !== '__otro__') setNombreActividad('') }} className="input-field"><option value="">Seleccionar culto...</option>{tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}{t.caracter ? ` — ${t.caracter}` : ''}</option>)}<option value="__otro__">Otro culto</option></select>{tipoId === '__otro__' && <input required minLength={3} maxLength={120} value={nombreActividad} onChange={(e) => setNombreActividad(e.target.value)} className="input-field mt-3" placeholder="Escribe el nombre del culto" />}</div>
      <div><label htmlFor="fecha-culto" className="text-sm font-medium block mb-1.5">Fecha del culto</label><div className="relative"><CalendarDays className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2" /><input id="fecha-culto" type="date" max={new Date().toLocaleDateString('en-CA')} value={fecha} onChange={(e) => setFecha(e.target.value)} className="input-field pl-11" /></div></div>
      <div><label className="text-sm font-medium block mb-3">Personas presentes</label><div className="grid grid-cols-2 gap-3">{categorias.map((cat) => <div key={cat.id}><label className="text-xs text-secondary block mb-1">{cat.nombre}</label><input type="number" min="0" inputMode="numeric" value={desglose[cat.id] ?? ''} onChange={(e) => actualizar(cat.id, e.target.value)} className="input-field text-center" placeholder="0" /></div>)}</div><div className="app-card mt-4 p-4 flex items-center justify-between"><span className="text-sm text-secondary">Total de asistentes</span><span className="text-3xl font-semibold text-accent">{total}</span></div></div>
      <div><label className="text-sm font-medium block mb-1.5">Novedades</label><textarea value={novedades} onChange={(e) => setNovedades(e.target.value)} rows={2} className="input-field" placeholder="Sin novedades" /></div>
      {error && <p className="text-sm text-danger text-center">{error}</p>}
      <button type="submit" disabled={saving} className="btn-primary flex items-center justify-center gap-2 py-4 shadow-lg shadow-ink/10">{saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar asistencia'}</button>
    </form>
    {confirming && <div className="fixed inset-0 z-10 flex items-end sm:items-center justify-center bg-ink/30 p-4"><div className="app-card w-full max-w-md p-5"><h2 className="text-lg font-semibold">Confirma la asistencia</h2><p className="text-sm text-secondary mt-1">Revisa los datos antes de guardar.</p><div className="bg-surface-1 rounded-xl p-4 mt-4 space-y-2 text-sm"><div className="flex justify-between gap-3"><span className="text-secondary">Culto</span><span className="font-medium text-right">{tipoId === '__otro__' ? nombreActividad : tipos.find((type) => type.id === tipoId)?.nombre}</span></div><div className="flex justify-between gap-3"><span className="text-secondary">Congregación</span><span className="font-medium text-right">{modulo?.congregaciones?.nombre}</span></div><div className="flex justify-between gap-3"><span className="text-secondary">Fecha</span><span className="font-medium">{fecha}</span></div><div className="flex justify-between gap-3"><span className="text-secondary">Asistentes</span><span className="font-semibold text-accent">{total}</span></div></div><div className="grid grid-cols-2 gap-3 mt-5"><button type="button" onClick={() => setConfirming(false)} className="btn-secondary">Volver a editar</button><button type="button" onClick={confirmSave} className="btn-primary">Confirmar</button></div></div></div>}
  </div></div>
}
