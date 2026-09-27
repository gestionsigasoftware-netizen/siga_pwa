import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import EmptyStreetIllustration from '../components/illustrations/EmptyStreetIllustration'

export default function NotFound() {
  const { t } = useTranslation()
  return <div className="app-shell"><div className="app-screen flex flex-col items-center justify-center text-center gap-4">
    <EmptyStreetIllustration className="w-56 h-auto" />
    <h1 className="text-lg font-semibold">{t('notFound.titulo')}</h1>
    <p className="text-sm text-secondary">{t('notFound.descripcion')}</p>
    <Link to="/" className="btn-primary mt-2 max-w-xs">{t('notFound.botonIrInicio')}</Link>
  </div></div>
}
