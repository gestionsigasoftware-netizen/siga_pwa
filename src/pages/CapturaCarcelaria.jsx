import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, BarChart3, CalendarDays, CheckCircle2, Loader2, Wifi } from 'lucide-react'
import { useMisAsignaciones } from '../hooks/useMisAsignaciones'
import { findDuplicateCultoCarcelaria, getCentrosReclusion, registrarCultoCarcelaria } from '../lib/supabase'
import { hasPendingCultoCarcelaria, queueCapture, rememberCapture } from '../lib/offline'
import { SkeletonForm } from '../components/Skeleton'

export default function CapturaCarcelaria() {
  const { t } = useTranslation()
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
      if (loadError) setError(t('capturaCarcelaria.errorCargarCentros'))
      setCentros(data ?? [])
      setLoadingDetalle(false)
    })
    return () => { active = false }
  }, [modulo])

  if (loadingAsig || (asignacion && loadingDetalle)) return <div className="app-shell"><div className="app-screen"><SkeletonForm /></div></div>

  if (!asignacion) return <div className="app-shell"><div className="app-screen flex flex-col items-center justify-center text-center gap-3"><p className="text-secondary">{t('common.sinAccesoModulo')}</p><button onClick={() => navigate('/')} className="text-accent underline text-sm">{t('common.volver')}</button></div></div>

  async function handleSubmit(e) {
    e.preventDefault()
    const total = parseInt(asistentesTotal, 10) || 0
    if (!fecha || total <= 0) { setError(t('capturaCarcelaria.errorCompletarFechaAsistentes')); return }
    setError(null)
    if (hasPendingCultoCarcelaria({ centroId: centroId || null, fecha, patio: patio.trim() })) {
      setError(t('common.errorRegistroPendienteSync'))
      return
    }
    if (navigator.onLine) {
      const { data: duplicate, error: duplicateError } = await findDuplicateCultoCarcelaria({ congregacionId: modulo.congregacion_id, centroId: centroId || null, fecha, patio: patio.trim() })
      if (duplicateError) { setError(t('common.errorVerificarDuplicado')); return }
      if (duplicate) { setError(t('capturaCarcelaria.errorDuplicadoCentro')); return }
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
      responsablePersonaId: asignacion.persona_id,
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
    if (saveError) { setError(t('common.errorGuardar', { mensaje: saveError.message })); return }
    rememberCapture({ label: `${modulo.nombre_modulo} · ${total} asistentes`, tipo: 'obra_carcelaria', payload, createdAt: new Date().toISOString() })
    setSavedOffline(false)
    setSuccess(true)
  }

  if (success) return <div className="app-shell"><div className="app-screen flex flex-col items-center justify-center text-center gap-4"><CheckCircle2 className="w-16 h-16 text-success" /><h2 className="text-lg font-semibold">{savedOffline ? t('capturaActividad.exitoGuardadoDispositivo') : t('capturaActividad.exitoSincronizado')}</h2><p className="text-sm text-secondary">{savedOffline ? t('common.seEnviaraAutomaticamente') : t('capturaCarcelaria.exitoDescOnline')}</p><button onClick={() => { setSuccess(false); setCentroId(''); setPatio(''); setAsistentesTotal(''); setEstudios(''); setNotas(''); setFecha(new Date().toLocaleDateString('en-CA')) }} className="btn-primary mt-4 max-w-xs">{t('capturaCarcelaria.botonRegistrarOtro')}</button></div></div>

  return <div className="app-shell"><div className="app-screen flex flex-col gap-6 pb-16">
    <div className="app-header">
      <div className="flex items-center gap-3 min-w-0">
        <button aria-label={t('common.ariaVolverModulos')} onClick={() => navigate('/')} className="w-11 h-11 flex-shrink-0 rounded-xl bg-surface-2 border border-border text-secondary flex items-center justify-center active:scale-[0.96] transition-transform"><ArrowLeft className="w-5 h-5" /></button>
        <div className="min-w-0"><p className="text-[11px] uppercase tracking-[0.08em] text-accent font-medium whitespace-nowrap">{t('capturaCarcelaria.eyebrow')}</p><h1 className="text-lg font-semibold truncate mt-1">{modulo?.nombre_modulo}</h1><p className="text-sm text-secondary truncate">{modulo?.congregaciones?.nombre || t('common.congregacionSinNombre')}</p><p className="text-xs text-muted truncate">{t('common.accesoHabilitado')}</p></div>
      </div>
      <div className="flex items-center gap-3"><button aria-label={t('common.ariaVerEstadisticas')} onClick={() => navigate('/estadisticas')} className="w-10 h-10 rounded-xl bg-surface-2 border border-border text-accent flex items-center justify-center"><BarChart3 className="w-4 h-4" /></button><Wifi className="w-4 h-4 text-success flex-shrink-0" aria-label={t('common.conectado')} /></div>
    </div>
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div><label className="text-sm font-medium block mb-1.5">{t('capturaCarcelaria.labelCentro')}</label><select value={centroId} onChange={(e) => setCentroId(e.target.value)} className="input-field"><option value="">{t('capturaCarcelaria.opcionSeleccionarCentro')}</option>{centros.map((c) => <option key={c.id} value={c.id}>{c.nombre}{c.ciudad ? ` — ${c.ciudad}` : ''}</option>)}</select></div>
      <div><label className="text-sm font-medium block mb-1.5">{t('capturaCarcelaria.labelPatio')}</label><input value={patio} onChange={(e) => setPatio(e.target.value)} className="input-field" placeholder={t('capturaCarcelaria.placeholderPatioOpcional')} /></div>
      <div><label htmlFor="fecha-culto-carcelaria" className="text-sm font-medium block mb-1.5">{t('capturaActividad.labelFechaCulto')}</label><div className="relative"><CalendarDays className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2" /><input id="fecha-culto-carcelaria" type="date" max={new Date().toLocaleDateString('en-CA')} value={fecha} onChange={(e) => setFecha(e.target.value)} className="input-field pl-11" /></div></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-secondary block mb-1">{t('capturaCarcelaria.labelAsistentes')}</label><input type="number" min="0" inputMode="numeric" value={asistentesTotal} onChange={(e) => setAsistentesTotal(e.target.value)} className="input-field text-center" placeholder="0" /></div>
        <div><label className="text-xs text-secondary block mb-1">{t('capturaCarcelaria.labelEstudiosEntregados')}</label><input type="number" min="0" inputMode="numeric" value={estudios} onChange={(e) => setEstudios(e.target.value)} className="input-field text-center" placeholder="0" /></div>
      </div>
      <div><label className="text-sm font-medium block mb-1.5">{t('capturaCarcelaria.labelNotas')}</label><textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} className="input-field" placeholder={t('capturaActividad.placeholderSinNovedades')} /></div>
      {error && <p className="text-sm text-danger text-center">{error}</p>}
      <button type="submit" disabled={saving} className="btn-primary flex items-center justify-center gap-2 py-4 shadow-lg shadow-ink/10">{saving ? <Loader2 className="w-5 h-5 animate-spin" /> : t('capturaCarcelaria.botonGuardarRegistro')}</button>
    </form>
    {confirming && <div className="fixed inset-0 z-10 flex items-end sm:items-center justify-center bg-ink/30 p-4"><div className="app-card w-full max-w-md p-5"><h2 className="text-lg font-semibold">{t('capturaCarcelaria.confirmaTitulo')}</h2><p className="text-sm text-secondary mt-1">{t('common.revisaLosDatos')}</p><div className="bg-surface-1 rounded-xl p-4 mt-4 space-y-2 text-sm"><div className="flex justify-between gap-3"><span className="text-secondary">{t('capturaCarcelaria.labelCentroConfirm')}</span><span className="font-medium text-right">{centros.find((c) => c.id === centroId)?.nombre || t('common.sinEspecificar')}</span></div><div className="flex justify-between gap-3"><span className="text-secondary">{t('estadisticas.congregacion')}</span><span className="font-medium text-right">{modulo?.congregaciones?.nombre}</span></div><div className="flex justify-between gap-3"><span className="text-secondary">{t('capturaCarcelaria.labelFecha')}</span><span className="font-medium">{fecha}</span></div><div className="flex justify-between gap-3"><span className="text-secondary">{t('capturaCarcelaria.labelAsistentesConfirm')}</span><span className="font-semibold text-accent">{parseInt(asistentesTotal, 10) || 0}</span></div></div><div className="grid grid-cols-2 gap-3 mt-5"><button type="button" onClick={() => setConfirming(false)} className="btn-secondary">{t('common.volverAEditar')}</button><button type="button" onClick={confirmSave} className="btn-primary">{t('common.confirmar')}</button></div></div></div>}
  </div></div>
}
