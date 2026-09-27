import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, BarChart3, CalendarDays, CheckCircle2, Loader2, Wifi } from 'lucide-react'
import { useMisAsignaciones } from '../hooks/useMisAsignaciones'
import { findDuplicateActivity, getCategorias, getCaracteresCulto, getTiposActividad, getUjieresCongregacion, registrarActividad } from '../lib/supabase'
import { hasPendingCapture, queueCapture, rememberCapture } from '../lib/offline'
import { esModuloUjieres } from '../lib/modulos'
import { SkeletonForm } from '../components/Skeleton'

export default function CapturaActividad() {
  const { t } = useTranslation()
  const { asignacionId } = useParams()
  const navigate = useNavigate()
  const { asignaciones, loading: loadingAsig } = useMisAsignaciones()
  const [asignacion, setAsignacion] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [tipos, setTipos] = useState([])
  const [caracteres, setCaracteres] = useState([])
  const [ujieres, setUjieres] = useState([])
  const [loadingDetalle, setLoadingDetalle] = useState(true)
  const [tipoId, setTipoId] = useState('')
  const [caracterId, setCaracterId] = useState('')
  const [ujierResponsableId, setUjierResponsableId] = useState('')
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
  const esUjieres = esModuloUjieres(modulo?.nombre_modulo)

  useEffect(() => {
    if (!modulo) return
    let active = true
    setLoadingDetalle(true)
    Promise.all([
      getCategorias(modulo.congregacion_id),
      getTiposActividad(modulo.id),
      getCaracteresCulto(modulo.congregacion_id),
      esModuloUjieres(modulo.nombre_modulo) ? getUjieresCongregacion(modulo.congregacion_id) : Promise.resolve({ data: [] }),
    ]).then(([categoriasRes, tiposRes, caracteresRes, ujieresRes]) => {
      if (!active) return
      if (categoriasRes.error || tiposRes.error) setError(t('capturaActividad.errorCargarFormulario'))
      setCategorias(categoriasRes.data ?? [])
      setTipos(tiposRes.data ?? [])
      setCaracteres(caracteresRes.data ?? [])
      setUjieres(ujieresRes.data ?? [])
      setLoadingDetalle(false)
    })
    return () => { active = false }
  }, [modulo])

  if (loadingAsig || (asignacion && loadingDetalle)) return <div className="app-shell"><div className="app-screen"><SkeletonForm /></div></div>

  if (!asignacion) return <div className="app-shell"><div className="app-screen flex flex-col items-center justify-center text-center gap-3"><p className="text-secondary">{t('common.sinAccesoModulo')}</p><button onClick={() => navigate('/')} className="text-accent underline text-sm">{t('common.volver')}</button></div></div>

  function actualizar(catId, valor) {
    setDesglose((prev) => ({ ...prev, [catId]: parseInt(valor, 10) || 0 }))
  }

  const total = Object.values(desglose).reduce((a, b) => a + b, 0)

  async function handleSubmit(e) {
    e.preventDefault()
    if ((!tipoId && !nombreActividad.trim()) || total <= 0 || !fecha) { setError(t('capturaActividad.errorCompletarCultoFecha')); return }
    if (esUjieres && ujieres.length > 0 && !ujierResponsableId) { setError(t('capturaActividad.errorSeleccionaUjierResponsable')); return }
    setError(null)
    if (hasPendingCapture({ moduloId: modulo.id, tipoActividadId: tipoId, nombreActividad: nombreActividad.trim(), zonaId: asignacion.zona_id, fecha })) {
      setError(t('common.errorRegistroPendienteSync'))
      return
    }
    if (navigator.onLine) {
      const { data: duplicate, error: duplicateError } = await findDuplicateActivity({ moduloId: modulo.id, tipoActividadId: tipoId, nombreActividad: nombreActividad.trim(), zonaId: asignacion.zona_id, fecha })
      if (duplicateError) { setError(t('common.errorVerificarDuplicado')); return }
      if (duplicate) { setError(t('capturaActividad.errorDuplicado')); return }
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
      responsablePersonaId: asignacion.persona_id,
      caracterId: caracterId || null,
      ujierResponsableId: ujierResponsableId || null,
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
    if (saveError) { setError(t('common.errorGuardar', { mensaje: saveError.message })); return }
    rememberCapture({ label: `${modulo.nombre_modulo} · ${total} asistentes`, payload, createdAt: new Date().toISOString() })
    setSavedOffline(false)
    setSuccess(true)
  }

  if (success) return <div className="app-shell"><div className="app-screen flex flex-col items-center justify-center text-center gap-4"><CheckCircle2 className="w-16 h-16 text-success" /><h2 className="text-lg font-semibold">{savedOffline ? t('capturaActividad.exitoGuardadoDispositivo') : t('capturaActividad.exitoSincronizado')}</h2><p className="text-sm text-secondary">{savedOffline ? t('common.seEnviaraAutomaticamente') : t('capturaActividad.exitoDescOnline')}</p><button onClick={() => { setSuccess(false); setDesglose({}); setNovedades(''); setTipoId(''); setNombreActividad(''); setCaracterId(''); setUjierResponsableId(''); setFecha(new Date().toLocaleDateString('en-CA')) }} className="btn-primary mt-4 max-w-xs">{t('capturaActividad.botonRegistrarOtra')}</button></div></div>

  return <div className="app-shell"><div className="app-screen flex flex-col gap-6 pb-16">
    <div className="app-header">
      <div className="flex items-center gap-3 min-w-0">
        <button aria-label={t('common.ariaVolverModulos')} onClick={() => navigate('/')} className="w-11 h-11 flex-shrink-0 rounded-xl bg-surface-2 border border-border text-secondary flex items-center justify-center active:scale-[0.96] transition-transform"><ArrowLeft className="w-5 h-5" /></button>
        <div className="min-w-0"><p className="text-[11px] uppercase tracking-[0.08em] text-accent font-medium whitespace-nowrap">{t('capturaActividad.eyebrow')}</p><h1 className="text-lg font-semibold truncate mt-1">{modulo?.nombre_modulo}</h1><p className="text-sm text-secondary truncate">{modulo?.congregaciones?.nombre || t('common.congregacionSinNombre')}</p><p className="text-xs text-muted truncate">{t('common.accesoHabilitado')}{asignacion.zonas?.nombre ? ` — ${asignacion.zonas.nombre}` : ''}</p></div>
      </div>
      <div className="flex items-center gap-3"><button aria-label={t('common.ariaVerEstadisticas')} onClick={() => navigate('/estadisticas')} className="w-10 h-10 rounded-xl bg-surface-2 border border-border text-accent flex items-center justify-center"><BarChart3 className="w-4 h-4" /></button><Wifi className="w-4 h-4 text-success flex-shrink-0" aria-label={t('common.conectado')} /></div>
    </div>
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div><label className="text-sm font-medium block mb-1.5">{t('capturaActividad.labelQueCultoRegistras')}</label><select value={tipoId} onChange={(e) => { setTipoId(e.target.value); if (e.target.value !== '__otro__') setNombreActividad('') }} className="input-field"><option value="">{t('capturaActividad.opcionSeleccionarCulto')}</option>{tipos.map((tipo) => <option key={tipo.id} value={tipo.id}>{tipo.nombre}{tipo.caracter ? ` — ${tipo.caracter}` : ''}</option>)}<option value="__otro__">{t('capturaActividad.opcionOtroCulto')}</option></select>{tipoId === '__otro__' && <input required minLength={3} maxLength={120} value={nombreActividad} onChange={(e) => setNombreActividad(e.target.value)} className="input-field mt-3" placeholder={t('capturaActividad.placeholderNombreCulto')} />}</div>
      {esUjieres && ujieres.length > 0 && <div><label className="text-sm font-medium block mb-1.5">{t('capturaActividad.labelUjierResponsable')}</label><select required value={ujierResponsableId} onChange={(e) => setUjierResponsableId(e.target.value)} className="input-field"><option value="">{t('capturaActividad.opcionSeleccionarUjier')}</option>{ujieres.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}</select></div>}
      {caracteres.length > 0 && <div><label className="text-sm font-medium block mb-1.5">{t('capturaActividad.labelCaracterCulto')} <span className="text-xs text-muted">{t('common.opcional')}</span></label><select value={caracterId} onChange={(e) => setCaracterId(e.target.value)} className="input-field"><option value="">{t('common.sinEspecificar')}</option>{caracteres.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>}
      <div><label htmlFor="fecha-culto" className="text-sm font-medium block mb-1.5">{t('capturaActividad.labelFechaCulto')}</label><div className="relative"><CalendarDays className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2" /><input id="fecha-culto" type="date" max={new Date().toLocaleDateString('en-CA')} value={fecha} onChange={(e) => setFecha(e.target.value)} className="input-field pl-11" /></div></div>
      <div><label className="text-sm font-medium block mb-3">{t('capturaActividad.labelPersonasPresentes')}</label><div className="grid grid-cols-2 gap-3">{categorias.map((cat) => <div key={cat.id}><label className="text-xs text-secondary block mb-1">{cat.nombre}</label><input type="number" min="0" inputMode="numeric" value={desglose[cat.id] ?? ''} onChange={(e) => actualizar(cat.id, e.target.value)} className="input-field text-center" placeholder="0" /></div>)}</div><div className="app-card mt-4 p-4 flex items-center justify-between"><span className="text-sm text-secondary">{t('capturaActividad.labelTotalAsistentes')}</span><span className="text-3xl font-semibold text-accent">{total}</span></div></div>
      <div><label className="text-sm font-medium block mb-1.5">{t('capturaActividad.labelNovedades')}</label><textarea value={novedades} onChange={(e) => setNovedades(e.target.value)} rows={2} className="input-field" placeholder={t('capturaActividad.placeholderSinNovedades')} /></div>
      {error && <p className="text-sm text-danger text-center">{error}</p>}
      <button type="submit" disabled={saving} className="btn-primary flex items-center justify-center gap-2 py-4 shadow-lg shadow-night/10">{saving ? <Loader2 className="w-5 h-5 animate-spin" /> : t('capturaActividad.botonGuardarAsistencia')}</button>
    </form>
    {confirming && <div className="fixed inset-0 z-10 flex items-end sm:items-center justify-center bg-night/30 p-4"><div className="app-card w-full max-w-md p-5"><h2 className="text-lg font-semibold">{t('capturaActividad.confirmaTitulo')}</h2><p className="text-sm text-secondary mt-1">{t('common.revisaLosDatos')}</p><div className="bg-surface-1 rounded-xl p-4 mt-4 space-y-2 text-sm"><div className="flex justify-between gap-3"><span className="text-secondary">{t('capturaActividad.labelCulto')}</span><span className="font-medium text-right">{tipoId === '__otro__' ? nombreActividad : tipos.find((type) => type.id === tipoId)?.nombre}</span></div>{ujierResponsableId && <div className="flex justify-between gap-3"><span className="text-secondary">{t('capturaActividad.labelUjierResponsable')}</span><span className="font-medium text-right">{ujieres.find((u) => u.id === ujierResponsableId)?.nombre}</span></div>}{caracterId && <div className="flex justify-between gap-3"><span className="text-secondary">{t('capturaActividad.labelCaracter')}</span><span className="font-medium text-right">{caracteres.find((c) => c.id === caracterId)?.nombre}</span></div>}<div className="flex justify-between gap-3"><span className="text-secondary">{t('estadisticas.congregacion')}</span><span className="font-medium text-right">{modulo?.congregaciones?.nombre}</span></div><div className="flex justify-between gap-3"><span className="text-secondary">{t('capturaActividad.labelFecha')}</span><span className="font-medium">{fecha}</span></div><div className="flex justify-between gap-3"><span className="text-secondary">{t('capturaActividad.labelAsistentes')}</span><span className="font-semibold text-accent">{total}</span></div></div><div className="grid grid-cols-2 gap-3 mt-5"><button type="button" onClick={() => setConfirming(false)} className="btn-secondary">{t('common.volverAEditar')}</button><button type="button" onClick={confirmSave} className="btn-primary">{t('common.confirmar')}</button></div></div></div>}
  </div></div>
}
