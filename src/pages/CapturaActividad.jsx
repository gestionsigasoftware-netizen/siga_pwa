import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Loader2, Wifi } from 'lucide-react'
import { useMisAsignaciones } from '../hooks/useMisAsignaciones'
import { getCategorias, getTiposActividad, registrarActividad } from '../lib/supabase'

export default function CapturaActividad() {
  const { asignacionId } = useParams()
  const navigate = useNavigate()
  const { asignaciones, loading: loadingAsig } = useMisAsignaciones()
  const [asignacion, setAsignacion] = useState(null)

  const [categorias, setCategorias] = useState([])
  const [tipos, setTipos] = useState([])
  const [tipoId, setTipoId] = useState('')
  const [desglose, setDesglose] = useState({})
  const [novedades, setNovedades] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
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

  if (loadingAsig) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
  }

  if (!asignacion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-3">
        <p className="text-secondary">No tienes acceso a este módulo.</p>
        <button onClick={() => navigate('/')} className="text-accent underline text-sm">Volver</button>
      </div>
    )
  }

  function actualizar(catId, valor) {
    setDesglose((prev) => ({ ...prev, [catId]: parseInt(valor, 10) || 0 }))
  }

  const total = Object.values(desglose).reduce((a, b) => a + b, 0)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!tipoId || total <= 0) { setError('Elige el tipo de actividad e ingresa al menos un asistente.'); return }
    setError(null)
    setSaving(true)

    // La persona logueada es el responsable — se resuelve automáticamente
    // server-side vía capturado_por = auth.uid() en el esquema.
    const { error } = await registrarActividad({
      congregacionId: modulo.congregacion_id,
      moduloId: modulo.id,
      tipoActividadId: tipoId,
      zonaId: asignacion.zona_id,
      responsablePersonaId: null, // se resuelve server-side vía capturado_por = auth.uid()
      desglose,
      novedades,
    })

    setSaving(false)
    if (error) { setError('No se pudo guardar: ' + error.message); return }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-4">
        <CheckCircle2 className="w-16 h-16 text-success" />
        <h2 className="text-lg font-semibold">Registro guardado</h2>
        <p className="text-sm text-secondary">Gracias por tu servicio.</p>
        <button
          onClick={() => { setSuccess(false); setDesglose({}); setNovedades(''); setTipoId('') }}
          className="btn-primary mt-4 max-w-xs"
        >
          Registrar otra
        </button>
      </div>
    )
  }

  return (
    <div className="app-screen flex flex-col gap-6 pb-16">
      <div className="app-header">
        <div className="flex items-center gap-3 min-w-0">
        <button aria-label="Volver a módulos" onClick={() => navigate('/')} className="w-11 h-11 flex-shrink-0 rounded-xl bg-surface-2 border border-border text-secondary flex items-center justify-center active:scale-[0.96] transition-transform">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.14em] text-accent font-medium">Registro de asistencia</p>
          <h1 className="text-lg font-semibold truncate mt-1">{modulo?.nombre_modulo}</h1>
          <p className="text-sm text-secondary truncate">
            {asignacion.cargos?.nombre_cargo}
            {asignacion.zonas?.nombre ? ` — ${asignacion.zonas.nombre}` : ''}
          </p>
        </div>
        </div>
        <Wifi className="w-4 h-4 text-success flex-shrink-0" aria-label="Conectado" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="text-sm font-medium block mb-1.5">¿Qué actividad registras?</label>
          <select value={tipoId} onChange={(e) => setTipoId(e.target.value)} required className="input-field">
            <option value="">Seleccionar...</option>
            {tipos.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}{t.caracter ? ` — ${t.caracter}` : ''}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium block mb-3">Personas presentes</label>
          <div className="grid grid-cols-2 gap-3">
            {categorias.map((cat) => (
              <div key={cat.id}>
                <label className="text-xs text-secondary block mb-1">{cat.nombre}</label>
                <input
                  type="number" min="0" inputMode="numeric"
                  value={desglose[cat.id] ?? ''}
                  onChange={(e) => actualizar(cat.id, e.target.value)}
                  className="input-field text-center"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
          <div className="app-card mt-4 p-4 flex items-center justify-between"><span className="text-sm text-secondary">Total de asistentes</span><span className="text-3xl font-semibold text-accent">{total}</span></div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1.5">Novedades</label>
          <textarea value={novedades} onChange={(e) => setNovedades(e.target.value)} rows={2} className="input-field" placeholder="Sin novedades" />
        </div>

        {error && <p className="text-sm text-danger text-center">{error}</p>}

        <button type="submit" disabled={saving} className="btn-primary flex items-center justify-center gap-2 py-4 shadow-lg shadow-ink/10">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar registro'}
        </button>
      </form>
    </div>
  )
}
