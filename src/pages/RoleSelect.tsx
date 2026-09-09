import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { User, ShieldCheck, Factory, ChevronRight } from 'lucide-react'
import { Screen, ScrollArea, AppBar } from '../components/UI'
import { useApp, type Role } from '../store/app'

const roles = [
  {
    id: 'consumer' as const,
    icon: User,
    titleKey: 'role.consumerTitle',
    bodyKey: 'role.consumerBody',
    badgeClass: 'bg-ok-soft text-ok-base',
    borderClass: 'hover:border-ok-base/50',
    target: '/app/home',
  },
  {
    id: 'officer' as const,
    icon: ShieldCheck,
    titleKey: 'role.officerTitle',
    bodyKey: 'role.officerBody',
    badgeClass: 'bg-info-soft text-info-base',
    borderClass: 'hover:border-info-base/50',
    target: '/app/officer',
  },
  {
    id: 'manufacturer' as const,
    icon: Factory,
    titleKey: 'role.mfgTitle',
    bodyKey: 'role.mfgBody',
    badgeClass: 'bg-purple-soft text-purple-base',
    borderClass: 'hover:border-purple-base/50',
    target: '/app/home',
  },
]

export default function RoleSelect() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const setRole = useApp((s) => s.setRole)
  const currentRole = useApp((s) => s.role)
  const [selected, setSelected] = useState<Role>(currentRole || 'consumer')

  const handleSelect = (id: Role, target: string) => {
    setSelected(id)
    setRole(id)
    nav(target)
  }

  return (
    <Screen>
      <AppBar back onBack={() => nav('/login')} border={false} />
      <ScrollArea className="gutter pb-8">
        <div className="pt-2">
          {/* Subtle botanical leaf motif */}
          <div className="flex items-center justify-between">
            <h1 className="font-display text-3xl font-bold tracking-[-0.025em] text-ink-900">
              {t('role.title')}
            </h1>
            <svg viewBox="0 0 32 32" className="h-8 w-8 text-brand-500/60" fill="none" aria-hidden>
              <path
                d="M8 24C8 16 16 8 26 6C24 16 16 24 8 24Z"
                fill="var(--cmp-ok-soft)"
                stroke="var(--cmp-ok)"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path d="M8 24C14 18 19 13 26 6" stroke="var(--cmp-ok)" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            {t('role.subtitle')}
          </p>
        </div>

        {/* 3 Role Selection Cards */}
        <div className="mt-7 space-y-3.5">
          {roles.map(({ id, icon: Icon, titleKey, bodyKey, badgeClass, borderClass, target }) => {
            const isSelected = selected === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleSelect(id, target)}
                className={`card-interactive flex w-full items-center gap-4 p-4 text-left ${
                  isSelected ? 'border-brand-500 bg-surface shadow-md' : 'bg-surface'
                } ${borderClass}`}
              >
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${badgeClass}`}>
                  <Icon size={24} strokeWidth={2} aria-hidden />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-md font-semibold text-ink-900">{t(titleKey)}</h2>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-500">{t(bodyKey)}</p>
                </div>

                <ChevronRight size={20} className="shrink-0 text-ink-400" aria-hidden />
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </Screen>
  )
}
