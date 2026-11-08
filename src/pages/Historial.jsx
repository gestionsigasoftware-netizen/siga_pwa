import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react'
import { getMiHistorial } from '../lib/supabase'
import { labelDeHistorial, fechaHistorial } from '../lib/historial'
import { SkeletonHistorial } from '../components/Skeleton'

// Traer 1000 cubre cualquier cuenta real; la paginacion de abajo es
// solo de PANTALLA (nunca pinta mas de POR_PAGINA filas a la vez) --
// no es scroll infinito, son paginas fijas con Anterior/Siguiente.
const POR_PAGINA = 30

export default function Historial() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagina, setPagina] = useState(1)

  useEffect(() => {
    let activo = true
    getMiHistorial(1000).then(({ data, error: loadError }) => {
      if (!activo) return
      if (loadError) setError(t('historial.errorCargar'))
      setItems(data)
      setLoading(false)
    })
    return () => { activo = false }
  }, [t])

  const totalPaginas = Math.max(1, Math.ceil(items.length / POR_PAGINA))
  const itemsPagina = useMemo(() => items.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA), [items, pagina])

  if (loading) return <div className="app-shell"><div className="app-screen"><SkeletonHistorial /></div></div>

  return <div className="app-shell"><div className="app-screen flex flex-col gap-6">
    <header className="app-header">
      <div className="flex items-center gap-3">
        <button aria-label={t('common.volver')} onClick={() => navigate(-1)} className="w-11 h-11 rounded-xl bg-surface-2 border border-border text-secondary flex items-center justify-center"><ArrowLeft className="w-5 h-5" /></button>
        <div><p className="text-xs uppercase tracking-[0.14em] text-accent font-medium">{t('historial.subtitulo')}</p><h1 className="text-xl font-semibold mt-1">{t('historial.titulo')}</h1></div>
      </div>
      <Clock3 className="w-5 h-5 text-accent" />
    </header>
    {error && <p role="alert" className="text-sm text-danger bg-danger-bg rounded-xl p-3">{error}</p>}
    {items.length ? <>
      <div className="app-card divide-y divide-border">{itemsPagina.map((item) => <div key={item.id} className="p-3 flex items-center justify-between gap-3"><span className="text-sm text-secondary truncate">{labelDeHistorial(item, t)}</span><span className="text-xs text-muted flex-shrink-0">{fechaHistorial(item.createdAt)}</span></div>)}</div>
      {totalPaginas > 1 && <div className="flex items-center justify-between gap-3">
        <button type="button" disabled={pagina === 1} onClick={() => setPagina((p) => p - 1)} className="w-11 h-11 rounded-xl bg-surface-2 border border-border text-secondary flex items-center justify-center disabled:opacity-40"><ChevronLeft className="w-5 h-5" /></button>
        <p className="text-xs text-secondary">{t('historial.paginaDe', { pagina, total: totalPaginas })}</p>
        <button type="button" disabled={pagina === totalPaginas} onClick={() => setPagina((p) => p + 1)} className="w-11 h-11 rounded-xl bg-surface-2 border border-border text-secondary flex items-center justify-center disabled:opacity-40"><ChevronRight className="w-5 h-5" /></button>
      </div>}
    </> : <div className="app-card p-6 text-center text-sm text-secondary">{t('historial.vacio')}</div>}
  </div></div>
}
