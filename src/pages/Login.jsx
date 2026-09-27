import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowUpRight, Eye, EyeOff, Loader2, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import LanguageSwitcher from '../components/LanguageSwitcher'
import sigapLogoWhite from '../assets/sigap-logo-white.svg'

export default function Login() {
  const { t } = useTranslation()
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      // AuthRetryableFetchError = el fetch en si fallo (sin internet),
      // no una respuesta del servidor -- sin esto, "sin conexion" se
      // mostraba igual que "usuario o contraseña incorrectos".
      const sinConexion = error.name === 'AuthRetryableFetchError' || !navigator.onLine
      setError(sinConexion ? t('login.errorSinConexion') : t('login.errorCredenciales'))
      return
    }
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-2 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <main className="w-full max-w-md mx-auto flex-1 flex flex-col">
        <header className="bg-ink text-white px-6 pt-8 pb-14 sm:px-8 overflow-hidden relative flex-shrink-0">
          <div className="absolute -right-16 -top-20 w-48 h-48 rounded-full border-[28px] border-accent/30" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <img src={sigapLogoWhite} alt="SIGAP" className="h-8 w-auto" />
              <LanguageSwitcher dark />
            </div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/45 mt-2">{t('login.tagline')}</p>
            <div className="mt-10 max-w-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-white/60">{t('login.eyebrowHero')}</p>
              <h2 className="text-2xl font-semibold leading-tight mt-3">{t('login.heroTitulo')}</h2>
              <p className="text-sm text-white/65 leading-6 mt-3">{t('login.heroDescripcion')}</p>
            </div>
          </div>
        </header>

        <section className="px-6 sm:px-8 pt-7 pb-6 -mt-6 rounded-t-3xl bg-surface-2 flex-1 flex flex-col">
          <div className="mb-7">
            <p className="text-sm font-medium text-[#165b9f] mb-2">{t('login.tuEspacio')}</p>
            <h1 className="text-2xl font-semibold tracking-tight">{t('login.titulo')}</h1>
            <p className="text-sm text-secondary mt-2 leading-6">{t('login.subtitulo')}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium block mb-1.5">{t('login.labelCorreo')}</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
                <input id="email" type="email" required autoComplete="email" placeholder="nombre@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-11" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium block mb-1.5">{t('login.labelPassword')}</label>
              <div className="relative">
                <LockKeyhole className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
                <input id="password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" placeholder={t('login.labelPassword')} value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pl-11 pr-11" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? t('login.ocultarPassword') : t('login.mostrarPassword')} title={showPassword ? t('login.ocultarPassword') : t('login.mostrarPassword')} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-ink transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <p role="alert" className="text-sm text-danger bg-danger-bg rounded p-3">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2 mt-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{t('login.botonIngresar')} <ArrowUpRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="mt-auto pt-8 flex flex-col items-center gap-3">
            <p className="flex items-center justify-center gap-2 text-xs text-muted"><ShieldCheck className="w-4 h-4 text-success" /> {t('login.datosProtegidos')}</p>
            <p className="text-center text-xs text-muted">{t('login.footer')}</p>
          </div>
        </section>
      </main>
    </div>
  )
}
