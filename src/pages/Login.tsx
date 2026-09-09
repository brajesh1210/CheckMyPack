import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
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
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  /**
   * Guest and government-ID sign-in are local identities: nothing is verified,
   * and the app is fully usable that way.
   */
  const goLocal = (provider: 'gov' | 'guest', name: string) => {
    setBusy(provider)
    setUser({ name, email: email || '', provider })
    nav('/role')
  }

  /**
   * Real Google sign-in when a backend is configured. Without one there is
   * nothing to authenticate against, so fall back to a guest session rather
   * than pretending the user signed in.
   */
  const goGoogle = async () => {
    setError('')

    if (!backendConfigured()) {
      setBusy('guest')
      setUser(signInAsGuest().user)
      nav('/role')
      return
    }

    setBusy('google')
    const result = await signInWithGoogle()

    if (result.error) {
      setError(result.error)
      setBusy(null)
      return
    }

    // On success the browser is navigating to Google, or the native deep link
    // will complete the exchange; either way this screen is on its way out.
    if (result.user) {
      setUser(result.user)
      nav('/role')
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.includes('@')) {
      setError(t('auth.invalidEmail'))
      return
    }
    if (pw.length < 6) {
      setError(t('auth.shortPassword'))
      return
    }
    setError('')
    void goGoogle()
  }

  return (
    <Screen>
      <AppBar back onBack={() => nav('/')} border={false} />
      <ScrollArea className="gutter pb-10">
        <Mark size={44} className="text-brand-500" />
        <h1 className="mt-5 font-display text-3xl tracking-[-0.025em]">{t('auth.signIn')}</h1>
        <p className="mt-2 text-md leading-relaxed text-ink-500">
          {t('auth.signInSub')}
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="field-label">
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              className="field"
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!error && !email.includes('@')}
            />
          </div>

          <div>
            <label htmlFor="pw" className="field-label">
              {t('auth.password')}
            </label>
            <div className="relative">
              <input
                id="pw"
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                className="field pr-12"
                placeholder={t('auth.passwordPlaceholder')}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? t('auth.hidePassword') : t('auth.showPassword')}
                className="absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg text-ink-400 transition-colors hover:text-ink-700"
              >
                {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
              </button>
            </div>
            <p className="field-hint">{t('auth.passwordHint')}</p>
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-bad-soft px-3 py-2.5 text-sm font-medium text-bad-text">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary btn-block" disabled={!!busy}>
            {busy === 'google' && email ? <Loader2 size={18} className="animate-spin" aria-hidden /> : null}
            Continue
          </button>
        </form>

        <div className="my-6">
          <Divider label={t('auth.or')} />
        </div>

        <div className="space-y-2.5">
          <button type="button" onClick={() => void goGoogle()} className="btn-secondary btn-block" disabled={!!busy}>
            <GoogleGlyph />
            {t('auth.google')}
          </button>
          <button type="button" onClick={() => goLocal('gov', 'Insp. R. Verma')} className="btn-secondary btn-block" disabled={!!busy}>
            <ShieldCheck size={18} strokeWidth={1.9} className="text-info-base" aria-hidden />
            {t('auth.govId')}
          </button>
          <button type="button" onClick={() => goLocal('guest', signInAsGuest().user!.name)} className="btn-ghost btn-block" disabled={!!busy}>
            {t('auth.guest')}
          </button>
        </div>

        <p className="mt-7 text-center text-xs leading-relaxed text-ink-400">
          By continuing you agree that CheckMyPack is an advisory tool and its verdicts are not a
          legal determination.
        </p>
      </ScrollArea>
    </Screen>
  )
}
