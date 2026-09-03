import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BarChart3, CalendarDays } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getMisRegistros, getResumenCongregacion } from '../lib/supabase'
import { useMisAsignaciones } from '../hooks/useMisAsignaciones'
import { SkeletonEstadisticas } from '../components/Skeleton'
import Footer from '../components/Footer'

const PERIODS = [
  { id: 'dia', label: 'Hoy' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes', label: 'Mes' },
  { id: 'semestre', label: 'Semestre' },
  { id: 'ano', label: 'Año' },
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
  }, [])

  const { asignaciones } = useMisAsignaciones()
  const congregationId = asignaciones[0]?.cargos?.modulos?.congregacion_id

  useEffect(() => {
    if (!congregationId) return
    getResumenCongregacion(congregationId, `${new Date().getFullYear()}-01-01`).then(({ data, error: loadError }) => {
      if (loadError) setError(explainError(loadError, 'No se pudo cargar el resumen de la congregación.'))
      setCongregationRecords(data ?? [])
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

  if (loading) return <div className="app-shell"><div className="app-screen"><SkeletonEstadisticas /></div></div>

  return <div className="app-shell"><div className="app-screen flex flex-col gap-6">
    <header className="app-header"><div className="flex items-center gap-3"><button aria-label="Volver" onClick={() => navigate(-1)} className="w-11 h-11 rounded-xl bg-surface-2 border border-border text-secondary flex items-center justify-center"><ArrowLeft className="w-5 h-5" /></button><div><p className="text-xs uppercase tracking-[0.14em] text-accent font-medium">Resumen personal</p><h1 className="text-xl font-semibold mt-1">Mis estadísticas</h1></div></div><BarChart3 className="w-5 h-5 text-accent" /></header>
    <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setScope('personal')} className={`rounded-xl px-3 py-3 text-sm font-medium border ${scope === 'personal' ? 'bg-ink text-white border-ink' : 'bg-surface-2 text-secondary border-border'}`}>Mis registros</button><button type="button" onClick={() => setScope('congregacion')} className={`rounded-xl px-3 py-3 text-sm font-medium border ${scope === 'congregacion' ? 'bg-ink text-white border-ink' : 'bg-surface-2 text-secondary border-border'}`}>Congregación</button></div>
    <div className="flex gap-2 overflow-x-auto pb-1">{PERIODS.map((item) => <button key={item.id} type="button" onClick={() => setPeriod(item.id)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium border transition-colors ${period === item.id ? 'bg-ink text-white border-ink' : 'bg-surface-2 text-secondary border-border'}`}>{item.label}</button>)}</div>
    {error && <p role="alert" className="text-sm text-danger bg-danger-bg rounded-xl p-3">{error}</p>}
    <section className="grid grid-cols-2 gap-3"><div className="app-card p-4"><p className="text-xs text-secondary">Asistentes acumulados</p><p className="text-3xl font-semibold text-accent mt-2">{total}</p></div><div className="app-card p-4"><p className="text-xs text-secondary">Cultos registrados</p><p className="text-3xl font-semibold mt-2">{visibleRecords.length}</p></div><div className="app-card p-4"><p className="text-xs text-secondary">Promedio por culto</p><p className="text-3xl font-semibold mt-2">{average}</p></div><div className="app-card p-4"><p className="text-xs text-secondary">Periodo</p><p className="text-lg font-semibold mt-3">{PERIODS.find((item) => item.id === period)?.label}</p></div></section>
    <section><div className="flex items-center gap-2 mb-3"><CalendarDays className="w-4 h-4 text-accent" /><h2 className="text-sm font-medium">{scope === 'personal' ? 'Mis cultos registrados' : 'Asistencia de la congregación'}</h2></div>{visibleRecords.length ? <div className="app-card p-4 flex flex-col gap-4">{[...visibleRecords].sort((a, b) => b.fecha.localeCompare(a.fecha)).map((record) => <div key={`${record.fecha}-${record.id || record.registros}`}><div className="flex items-center justify-between gap-3 mb-1.5"><span className="text-xs text-secondary">{new Date(`${record.fecha}T12:00:00`).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}{record.nombre_actividad ? ` · ${record.nombre_actividad}` : record.tipos_actividad?.nombre ? ` · ${record.tipos_actividad.nombre}` : ''}</span><span className="text-sm font-semibold">{record.total_asistentes}</span></div><div className="h-2 rounded-full bg-surface-1 overflow-hidden"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.max((record.total_asistentes / max) * 100, 3)}%` }} /></div></div>)}</div> : <div className="app-card p-6 text-center text-sm text-secondary">No hay registros en este periodo.</div>}</section>
    <Footer />
  </div></div>
}
