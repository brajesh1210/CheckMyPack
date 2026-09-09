import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Shield, ArrowRight, UserCheck } from 'lucide-react'
import { Screen, ScrollArea, AppBar, Divider } from '../components/UI'
import { Mark } from '../components/Brand'
import { useApp } from '../store/app'
import { signInWithGoogle, signInAsGuest } from '../lib/auth'
import { backendConfigured } from '../lib/supabase'

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.94v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.94a9 9 0 0 0 0 8.1l3.03-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .94 4.95l3.03 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  )
}

export default function Login() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const setUser = useApp((s) => s.setUser)
  const [emailOrPhone, setEmailOrPhone] = useState('anah.sharma@example.com')
  const [pw, setPw] = useState('password123')
  const [show, setShow] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailOrPhone.trim()) {
      setError(t('auth.invalidEmail'))
      return
    }
    const name = emailOrPhone.includes('@') ? emailOrPhone.split('@')[0] : 'Anah Sharma'
    setUser({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email: emailOrPhone.includes('@') ? emailOrPhone : 'user@checkmypack.in',
      provider: 'google',
    })
    nav('/role')
  }

  const handleGovId = () => {
    setUser({
      name: 'Inspector R. K. Verma',
      email: 'officer.delhi@gov.in',
      provider: 'gov',
    })
    nav('/role')
  }

  const handleGuest = () => {
    setUser(signInAsGuest().user)
    nav('/role')
  }

  return (
    <Screen>
      <AppBar back onBack={() => nav('/')} border={false} />
      <ScrollArea className="gutter pb-8">
        <div className="pt-2">
          <Mark size={44} className="text-brand-500" />
          <h1 className="mt-4 font-display text-3xl font-bold tracking-[-0.025em] text-ink-900">
            {t('auth.welcomeBack')}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
            {t('auth.signInSub')}
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="emailOrPhone" className="field-label">
              {t('auth.email')}
            </label>
            <input
              id="emailOrPhone"
              type="text"
              autoComplete="username"
              className="field"
              placeholder={t('auth.emailPlaceholder')}
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              aria-label={t('auth.email')}
            />
          </div>

          <div>
            <label htmlFor="password" className="field-label">
              {t('auth.password')}
            </label>
            <div className="relative">
              <input
                id="password"
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                className="field pr-12"
                placeholder={t('auth.passwordPlaceholder')}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                aria-label={t('auth.password')}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? t('auth.hidePassword') : t('auth.showPassword')}
                className="absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg text-ink-400 hover:text-ink-700"
              >
                {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
              </button>
            </div>
          </div>

          {/* Remember me & forgot password */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-ink-700">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-ink-300 text-accent-500 focus:ring-accent-500"
              />
              {t('auth.rememberMe')}
            </label>
            <button
              type="button"
              onClick={() => nav('/role')}
              className="text-xs font-semibold text-accent-600 hover:text-accent-700"
            >
              {t('auth.forgotPassword')}
            </button>
          </div>

          {error && <p className="text-xs font-medium text-bad-base" role="alert">{error}</p>}

          <div className="pt-2">
            <button
              type="submit"
              className="btn-accent btn-block min-h-[48px] rounded-xl text-md font-semibold"
            >
              {t('auth.login')}
              <ArrowRight size={18} strokeWidth={2.2} aria-hidden />
            </button>
          </div>
        </form>

        <div className="my-6">
          <Divider label={t('auth.or')} />
        </div>

        <div className="space-y-3">
          {/* Government ID Button */}
          <button
            type="button"
            onClick={handleGovId}
            className="btn btn-block border border-ink-200 bg-surface text-ink-800 hover:border-ink-300 hover:bg-ink-50"
          >
            <Shield size={18} strokeWidth={2} className="text-info-base" aria-hidden />
            {t('auth.govId')}
          </button>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleLogin}
            className="btn btn-block border border-ink-200 bg-surface text-ink-800 hover:border-ink-300 hover:bg-ink-50"
          >
            <GoogleGlyph />
            {t('auth.google')}
          </button>

          {/* Guest Button */}
          <button
            type="button"
            onClick={handleGuest}
            className="btn-ghost btn-block min-h-[44px] text-sm text-ink-600"
          >
            {t('auth.guest')}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-ink-500">
          {t('auth.noAccount')}{' '}
          <button
            type="button"
            onClick={() => nav('/role')}
            className="font-semibold text-accent-600 hover:text-accent-700"
          >
            {t('auth.createOne')}
          </button>
        </div>
      </ScrollArea>
    </Screen>
  )
}
