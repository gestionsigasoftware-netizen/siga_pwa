import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BarChart3, CalendarDays } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getMisRegistrosPorModulo, getCongregacionRegistrosPorModulo, getMisCultosCarcelaria, getCultosCarcelariaCongregacion } from '../lib/supabase'
import { useMisAsignaciones } from '../hooks/useMisAsignaciones'
import { esModuloObraCarcelaria } from '../lib/modulos'
import { SkeletonEstadisticas } from '../components/Skeleton'
import i18n from '../i18n'

const PERIODS = ['dia', 'semana', 'mes', 'semestre', 'ano']

function localeActual() {
  return i18n.language === 'en' ? 'en-US' : i18n.language === 'pt' ? 'pt-BR' : 'es-CO'
}

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
  const locale = localeActual()
  if (period === 'dia') return capitalize(start.toLocaleDateString(locale, { day: 'numeric', month: 'long' }))
  if (period === 'semana') {
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    const mismoMes = start.getMonth() === end.getMonth()
    const inicio = mismoMes ? `${start.getDate()}` : start.toLocaleDateString(locale, { day: 'numeric', month: 'long' })
    return i18n.t('estadisticas.semanaRango', { inicio, fin: end.toLocaleDateString(locale, { day: 'numeric', month: 'long' }) })
  }
  if (period === 'mes') return capitalize(start.toLocaleDateString(locale, { month: 'long', year: 'numeric' }))
  if (period === 'semestre') return i18n.t(start.getMonth() === 0 ? 'estadisticas.primerSemestre' : 'estadisticas.segundoSemestre', { anio: start.getFullYear() })
  return i18n.t('estadisticas.anioLabel', { anio: start.getFullYear() })
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
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { asignaciones, loading: loadingAsignaciones } = useMisAsignaciones()
  const [period, setPeriod] = useState('mes')
  const [scope, setScope] = useState('personal')
  const [moduloId, setModuloId] = useState(null)
  const [records, setRecords] = useState([])
  const [congregationRecords, setCongregationRecords] = useState([])
  const [loadingDatos, setLoadingDatos] = useState(true)
  const [error, setError] = useState(null)

  function explainError(loadError, defaultMessage) {
    const message = loadError?.message?.toLowerCase() || ''
    if (message.includes('nombre_actividad') || message.includes('column')) return t('estadisticas.errorMigracion')
    return defaultMessage
  }

  // Los modulos que esta cuenta realmente tiene asignados -- ya no se mezcla
  // todo en una sola lista (ej. Ujieres y Obra Carcelaria juntos), cada uno
  // se ve por separado.
  const misModulos = useMemo(() => {
    const vistos = new Map()
    asignaciones.forEach((a) => {
      const m = a.cargos?.modulos
      if (m?.id && !vistos.has(m.id)) vistos.set(m.id, { id: m.id, nombre: m.nombre_modulo, esCarcelaria: esModuloObraCarcelaria(m.nombre_modulo) })
    })
    return Array.from(vistos.values())
  }, [asignaciones])

  useEffect(() => {
    if (!moduloId && misModulos.length) setModuloId(misModulos[0].id)
  }, [misModulos, moduloId])

  const moduloActivo = misModulos.find((m) => m.id === moduloId) ?? null
  const congregationId = asignaciones[0]?.cargos?.modulos?.congregacion_id

  useEffect(() => {
    if (!moduloActivo) { setLoadingDatos(false); return }
    setLoadingDatos(true)
    setError(null)
    const desde = `${new Date().getFullYear()}-01-01`
    const personalFetch = moduloActivo.esCarcelaria ? getMisCultosCarcelaria() : getMisRegistrosPorModulo(moduloActivo.id)
    const congregacionFetch = congregationId
      ? (moduloActivo.esCarcelaria ? getCultosCarcelariaCongregacion(congregationId, desde) : getCongregacionRegistrosPorModulo(congregationId, moduloActivo.id, desde))
      : Promise.resolve({ data: [] })
    Promise.all([personalFetch, congregacionFetch]).then(([personalRes, congregacionRes]) => {
      if (personalRes.error) setError(explainError(personalRes.error, t('estadisticas.errorCargar')))
      setRecords(personalRes.data ?? [])
      setCongregationRecords(congregacionRes.data ?? [])
      setLoadingDatos(false)
    })
  }, [moduloActivo?.id, congregationId])

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

  if (loadingAsignaciones || loadingDatos) return <div className="app-shell"><div className="app-screen"><SkeletonEstadisticas /></div></div>

  if (!moduloActivo) return <div className="app-shell"><div className="app-screen flex flex-col items-center justify-center text-center gap-3"><p className="text-secondary">{t('estadisticas.sinModuloAsignado')}</p><button onClick={() => navigate('/')} className="text-accent underline text-sm">{t('common.volver')}</button></div></div>

  const periodoShortLabels = { dia: t('estadisticas.periodoShortDia'), semana: t('estadisticas.periodoShortSemana'), mes: t('estadisticas.periodoShortMes'), semestre: t('estadisticas.periodoShortSemestre'), ano: t('estadisticas.periodoShortAno') }

  return <div className="app-shell"><div className="app-screen flex flex-col gap-6">
    <header className="app-header"><div className="flex items-center gap-3"><button aria-label={t('common.volver')} onClick={() => navigate(-1)} className="w-11 h-11 rounded-xl bg-surface-2 border border-border text-secondary flex items-center justify-center"><ArrowLeft className="w-5 h-5" /></button><div><p className="text-xs uppercase tracking-[0.14em] text-accent font-medium">{t('estadisticas.resumenPersonal')}</p><h1 className="text-xl font-semibold mt-1">{t('estadisticas.titulo')}</h1></div></div><BarChart3 className="w-5 h-5 text-accent" /></header>
    {misModulos.length > 1 && <div className="flex flex-wrap gap-2">{misModulos.map((m) => <button key={m.id} type="button" onClick={() => setModuloId(m.id)} className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${moduloId === m.id ? 'bg-night text-white border-night' : 'bg-surface-2 text-secondary border-border'}`}>{m.nombre}</button>)}</div>}
    <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setScope('personal')} className={`rounded-xl px-3 py-3 text-sm font-medium border ${scope === 'personal' ? 'bg-night text-white border-night' : 'bg-surface-2 text-secondary border-border'}`}>{t('estadisticas.misRegistros')}</button><button type="button" onClick={() => setScope('congregacion')} className={`rounded-xl px-3 py-3 text-sm font-medium border ${scope === 'congregacion' ? 'bg-night text-white border-night' : 'bg-surface-2 text-secondary border-border'}`}>{t('estadisticas.congregacion')}</button></div>
    <div>
      <div className="grid grid-cols-5 gap-1.5">{PERIODS.map((id) => <button key={id} type="button" onClick={() => setPeriod(id)} className={`rounded-xl py-2 text-xs font-medium border transition-colors ${period === id ? 'bg-night text-white border-night' : 'bg-surface-2 text-secondary border-border'}`}>{periodoShortLabels[id]}</button>)}</div>
      <p className="text-xs text-secondary mt-2 text-center">{resolvedPeriodLabel(period)}</p>
    </div>
    {error && <p role="alert" className="text-sm text-danger bg-danger-bg rounded-xl p-3">{error}</p>}
    <section className="grid grid-cols-2 gap-3">
      <div className="app-card p-4"><p className="text-xs text-secondary">{t('estadisticas.asistentesAcumulados')}</p><p className="text-3xl font-semibold text-accent mt-2">{total}</p></div>
      <div className="app-card p-4"><p className="text-xs text-secondary">{t('estadisticas.cultosRegistrados')}</p><p className="text-3xl font-semibold mt-2">{visibleRecords.length}</p></div>
      <div className="app-card p-4"><p className="text-xs text-secondary">{t('estadisticas.promedioPorCulto')}</p><p className="text-3xl font-semibold mt-2">{average}</p></div>
      <div className="app-card p-4">
        <p className="text-xs text-secondary">{t('estadisticas.tendencia')}</p>
        {tendencia === null ? <p className="text-sm font-medium mt-3 text-muted">{t('estadisticas.sinPeriodoAnterior')}</p> : <p className={`text-3xl font-semibold mt-2 ${tendencia >= 0 ? 'text-success' : 'text-danger'}`}>{tendencia >= 0 ? '+' : ''}{tendencia}%</p>}
      </div>
    </section>
    <section><div className="flex items-center gap-2 mb-3"><CalendarDays className="w-4 h-4 text-accent" /><h2 className="text-sm font-medium">{scope === 'personal' ? t('estadisticas.misCultosDe', { modulo: moduloActivo.nombre }) : t('estadisticas.congregacionDe', { modulo: moduloActivo.nombre })}</h2></div>{visibleRecords.length ? <div className="app-card p-4 flex flex-col gap-4">{[...visibleRecords].sort((a, b) => b.fecha.localeCompare(a.fecha)).map((record) => <div key={record.id}><div className="flex items-center justify-between gap-3 mb-1.5"><span className="text-xs text-secondary">{new Date(`${record.fecha}T12:00:00`).toLocaleDateString(localeActual(), { day: '2-digit', month: 'short' })}{record.nombre_actividad ? ` · ${record.nombre_actividad}` : record.tipos_actividad?.nombre ? ` · ${record.tipos_actividad.nombre}` : ''}</span><span className="text-sm font-semibold">{record.total_asistentes}</span></div><div className="h-2 rounded-full bg-surface-1 overflow-hidden"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.max((record.total_asistentes / max) * 100, 3)}%` }} /></div></div>)}</div> : <div className="app-card p-6 text-center text-sm text-secondary">{t('estadisticas.sinRegistrosPeriodo')}</div>}</section>
  </div></div>
}
