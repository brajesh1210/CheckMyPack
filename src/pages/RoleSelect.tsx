import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, ShieldCheck, ArrowRight, Check } from 'lucide-react'
import { Screen, ScrollArea, AppBar } from '../components/UI'
import { useApp, type Role } from '../store/app'

const roles = [
  {
    id: 'consumer' as const,
    icon: ShoppingBag,
    titleKey: 'role.consumerTitle',
    bodyKey: 'role.consumerBody',
    accent: 'text-brand-600 bg-brand-50 ring-brand-500',
  },
  {
    id: 'officer' as const,
    icon: ShieldCheck,
    titleKey: 'role.officerTitle',
    bodyKey: 'role.officerBody',
    accent: 'text-info-base bg-info-soft ring-info-base',
  },
]

export default function RoleSelect() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const setRole = useApp((s) => s.setRole)
  const [picked, setPicked] = useState<Role>('consumer')

  const proceed = () => {
    setRole(picked)
    nav(picked === 'officer' ? '/app/officer' : '/app/home')
  }

  return (
    <Screen>
      <AppBar back onBack={() => nav('/login')} border={false} />
      <ScrollArea className="gutter pb-6">
        <h1 className="font-display text-3xl tracking-[-0.025em]">{t('role.title')}</h1>
        <p className="mt-2 text-md leading-relaxed text-ink-500">
          {t('role.subtitle')}
        </p>

        <div role="radiogroup" aria-label={t('role.select')} className="stagger mt-7 space-y-3">
          {roles.map(({ id, icon: Icon, titleKey, bodyKey, accent }) => {
            const active = picked === id
            const [text, bg, ring] = accent.split(' ')
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPicked(id)}
                className={`card-interactive flex w-full gap-3.5 p-4 text-left ${
                  active ? `ring-2 ${ring} border-transparent` : ''
                }`}
              >
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${bg} ${text}`}>
                  <Icon size={21} strokeWidth={1.9} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-md font-semibold text-ink-900">{t(titleKey)}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-ink-500">{t(bodyKey)}</span>
                </span>
                <span
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                    active ? 'border-transparent bg-brand-500 text-white' : 'border-ink-300'
                  }`}
                  aria-hidden
                >
                  {active && <Check size={12} strokeWidth={3.2} />}
                </span>
              </button>
            )
          })}
        </div>
      </ScrollArea>

      <div className="safe-b gutter border-t border-ink-200 bg-surface py-3.5">
        <button type="button" onClick={proceed} className="btn-primary btn-block">
          {t('role.continue')}
          <ArrowRight size={18} strokeWidth={2.2} aria-hidden />
        </button>
      </div>
    </Screen>
  )
}
