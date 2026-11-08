import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Clock3 } from 'lucide-react'
import { getMiHistorial } from '../lib/supabase'
import { labelDeHistorial, fechaHistorial } from '../lib/historial'
import { SkeletonHistorial } from '../components/Skeleton'

export default function Historial() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let activo = true
    getMiHistorial(200).then(({ data, error: loadError }) => {
      if (!activo) return
      if (loadError) setError(t('historial.errorCargar'))
      setItems(data)
      setLoading(false)
    })
    return () => { activo = false }
  }, [t])

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
    {items.length ? <div className="app-card divide-y divide-border">{items.map((item) => <div key={item.id} className="p-3 flex items-center justify-between gap-3"><span className="text-sm text-secondary truncate">{labelDeHistorial(item, t)}</span><span className="text-xs text-muted flex-shrink-0">{fechaHistorial(item.createdAt)}</span></div>)}</div> : <div className="app-card p-6 text-center text-sm text-secondary">{t('historial.vacio')}</div>}
  </div></div>
}
