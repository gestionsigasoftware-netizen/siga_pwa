import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BarChart3, CalendarDays } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getMisRegistros, getResumenCongregacion, getMisCultosCarcelaria, getCultosCarcelariaCongregacion } from '../lib/supabase'
import { useMisAsignaciones } from '../hooks/useMisAsignaciones'
import { SkeletonEstadisticas } from '../components/Skeleton'

const PERIODS = [
  { id: 'dia', label: 'Hoy', short: 'Hoy' },
  { id: 'semana', label: 'Semana', short: 'Sem' },
  { id: 'mes', label: 'Mes', short: 'Mes' },
  { id: 'semestre', label: 'Semestre', short: '6M' },
  { id: 'ano', label: 'Año', short: 'Año' },
]

function dateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startForPeriod(period) {
  const now = new Date()
  if (period === 'dia') return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (period === 'semana') {
    const day = now.getDay() || 7
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1)
  }
  if (period === 'mes') return new Date(now.getFullYear(), now.getMonth(), 1)
  if (period === 'semestre') return new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1)
  return new Date(now.getFullYear(), 0, 1)
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// El texto concreto del periodo elegido (ej. "Septiembre 2026"), para que no
// solo se vea el nombre generico del boton ("Mes") sino a que fecha real
// corresponde.
function resolvedPeriodLabel(period) {
  const start = startForPeriod(period)
  if (period === 'dia') return capitalize(start.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' }))
  if (period === 'semana') {
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    const mismoMes = start.getMonth() === end.getMonth()
    const inicio = mismoMes ? `${start.getDate()}` : start.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })
    return `${inicio} al ${end.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}`
  }
  if (period === 'mes') return capitalize(start.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }))
  if (period === 'semestre') return `${start.getMonth() === 0 ? 'Primer' : 'Segundo'} semestre ${start.getFullYear()}`
  return `Año ${start.getFullYear()}`
}

// Mismo rango de duracion, inmediatamente anterior al periodo elegido -- para
// comparar contra algo concreto en vez de mostrar "Periodo: Mes" (redundante
// con el boton ya seleccionado arriba).
function previousRangeFor(period) {
  const start = startForPeriod(period)
  if (period === 'dia') { const prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - 1); return [prevStart, start] }
  if (period === 'semana') { const prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - 7); return [prevStart, start] }
  if (period === 'mes') return [new Date(start.getFullYear(), start.getMonth() - 1, 1), start]
  if (period === 'semestre') return [new Date(start.getFullYear(), start.getMonth() - 6, 1), start]
  return [new Date(start.getFullYear() - 1, 0, 1), new Date(start.getFullYear(), 0, 1)]
}

export default function Estadisticas() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState('mes')
  const [scope, setScope] = useState('personal')
  const [records, setRecords] = useState([])
  const [congregationRecords, setCongregationRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  function explainError(loadError, defaultMessage) {
    const message = loadError?.message?.toLowerCase() || ''
    if (message.includes('nombre_actividad') || message.includes('column')) return 'Falta activar la migración de cultos personalizados. Ejecuta actividad_personalizada.sql en Supabase.'
    if (message.includes('resumen_asistencia_movil') || message.includes('function')) return 'Falta activar el resumen congregacional. Ejecuta estadisticas_movil.sql en Supabase.'
    return defaultMessage
  }

  useEffect(() => {
    getMisRegistros().then(({ data, error: loadError }) => {
      if (loadError) setError(explainError(loadError, 'No se pudieron cargar tus estadísticas.'))
      setRecords(data ?? [])
      setLoading(false)
    })
    // Obra Carcelaria vive en su propia tabla (no en registros_actividad) --
    // se agrega aparte para que tampoco quede fuera de "Mis estadísticas".
    getMisCultosCarcelaria().then(({ data }) => {
      if (data?.length) setRecords((current) => [...current, ...data])
    })
  }, [])

  const { asignaciones } = useMisAsignaciones()
  const congregationId = asignaciones[0]?.cargos?.modulos?.congregacion_id

  useEffect(() => {
    if (!congregationId) return
    const desde = `${new Date().getFullYear()}-01-01`
    getResumenCongregacion(congregationId, desde).then(({ data, error: loadError }) => {
      if (loadError) setError(explainError(loadError, 'No se pudo cargar el resumen de la congregación.'))
      setCongregationRecords(data ?? [])
    })
    getCultosCarcelariaCongregacion(congregationId, desde).then(({ data }) => {
      if (data?.length) setCongregationRecords((current) => [...current, ...data])
    })
  }, [congregationId])

  const visiblePersonalRecords = useMemo(() => {
    const start = dateKey(startForPeriod(period))
    return records.filter((record) => record.fecha >= start)
  }, [records, period])
  const visibleCongregationRecords = useMemo(() => {
    const start = dateKey(startForPeriod(period))
    return congregationRecords.filter((record) => record.fecha >= start)
  }, [congregationRecords, period])
  const visibleRecords = scope === 'personal' ? visiblePersonalRecords : visibleCongregationRecords
  const total = visibleRecords.reduce((sum, record) => sum + (record.total_asistentes || 0), 0)
  const average = visibleRecords.length ? Math.round(total / visibleRecords.length) : 0
  const max = Math.max(...visibleRecords.map((record) => record.total_asistentes || 0), 1)

  const previousRecords = useMemo(() => {
    const [prevStart, prevEnd] = previousRangeFor(period)
    const source = scope === 'personal' ? records : congregationRecords
    const prevStartKey = dateKey(prevStart)
    const prevEndKey = dateKey(prevEnd)
    return source.filter((record) => record.fecha >= prevStartKey && record.fecha < prevEndKey)
  }, [records, congregationRecords, period, scope])
  const previousTotal = previousRecords.reduce((sum, record) => sum + (record.total_asistentes || 0), 0)
  const tendencia = previousRecords.length ? Math.round(((total - previousTotal) / (previousTotal || total || 1)) * 100) : null

  if (loading) return <div className="app-shell"><div className="app-screen"><SkeletonEstadisticas /></div></div>

  return <div className="app-shell"><div className="app-screen flex flex-col gap-6">
    <header className="app-header"><div className="flex items-center gap-3"><button aria-label="Volver" onClick={() => navigate(-1)} className="w-11 h-11 rounded-xl bg-surface-2 border border-border text-secondary flex items-center justify-center"><ArrowLeft className="w-5 h-5" /></button><div><p className="text-xs uppercase tracking-[0.14em] text-accent font-medium">Resumen personal</p><h1 className="text-xl font-semibold mt-1">Mis estadísticas</h1></div></div><BarChart3 className="w-5 h-5 text-accent" /></header>
    <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setScope('personal')} className={`rounded-xl px-3 py-3 text-sm font-medium border ${scope === 'personal' ? 'bg-ink text-white border-ink' : 'bg-surface-2 text-secondary border-border'}`}>Mis registros</button><button type="button" onClick={() => setScope('congregacion')} className={`rounded-xl px-3 py-3 text-sm font-medium border ${scope === 'congregacion' ? 'bg-ink text-white border-ink' : 'bg-surface-2 text-secondary border-border'}`}>Congregación</button></div>
    <div>
      <div className="grid grid-cols-5 gap-1.5">{PERIODS.map((item) => <button key={item.id} type="button" onClick={() => setPeriod(item.id)} className={`rounded-xl py-2 text-xs font-medium border transition-colors ${period === item.id ? 'bg-ink text-white border-ink' : 'bg-surface-2 text-secondary border-border'}`}>{item.short}</button>)}</div>
      <p className="text-xs text-secondary mt-2 text-center">{resolvedPeriodLabel(period)}</p>
    </div>
    {error && <p role="alert" className="text-sm text-danger bg-danger-bg rounded-xl p-3">{error}</p>}
    <section className="grid grid-cols-2 gap-3">
      <div className="app-card p-4"><p className="text-xs text-secondary">Asistentes acumulados</p><p className="text-3xl font-semibold text-accent mt-2">{total}</p></div>
      <div className="app-card p-4"><p className="text-xs text-secondary">Cultos registrados</p><p className="text-3xl font-semibold mt-2">{visibleRecords.length}</p></div>
      <div className="app-card p-4"><p className="text-xs text-secondary">Promedio por culto</p><p className="text-3xl font-semibold mt-2">{average}</p></div>
      <div className="app-card p-4">
        <p className="text-xs text-secondary">Tendencia</p>
        {tendencia === null ? <p className="text-sm font-medium mt-3 text-muted">Sin periodo anterior</p> : <p className={`text-3xl font-semibold mt-2 ${tendencia >= 0 ? 'text-success' : 'text-danger'}`}>{tendencia >= 0 ? '+' : ''}{tendencia}%</p>}
      </div>
    </section>
    <section><div className="flex items-center gap-2 mb-3"><CalendarDays className="w-4 h-4 text-accent" /><h2 className="text-sm font-medium">{scope === 'personal' ? 'Mis cultos registrados' : 'Asistencia de la congregación'}</h2></div>{visibleRecords.length ? <div className="app-card p-4 flex flex-col gap-4">{[...visibleRecords].sort((a, b) => b.fecha.localeCompare(a.fecha)).map((record) => <div key={`${record.fecha}-${record.id || record.registros}`}><div className="flex items-center justify-between gap-3 mb-1.5"><span className="text-xs text-secondary">{new Date(`${record.fecha}T12:00:00`).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}{record.nombre_actividad ? ` · ${record.nombre_actividad}` : record.tipos_actividad?.nombre ? ` · ${record.tipos_actividad.nombre}` : ''}</span><span className="text-sm font-semibold">{record.total_asistentes}</span></div><div className="h-2 rounded-full bg-surface-1 overflow-hidden"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.max((record.total_asistentes / max) * 100, 3)}%` }} /></div></div>)}</div> : <div className="app-card p-6 text-center text-sm text-secondary">No hay registros en este periodo.</div>}</section>
  </div></div>
}
