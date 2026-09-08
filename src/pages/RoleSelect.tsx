import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, ShieldCheck, Factory, ArrowRight, Check } from 'lucide-react'
import { Screen, ScrollArea, AppBar } from '../components/UI'
import { useApp, type Role } from '../store/app'

const roles = [
  {
    id: 'consumer' as const,
    icon: ShoppingBag,
    title: 'Consumer',
    body: 'Scan what you buy, learn your rights, and file a complaint when a pack is non-compliant.',
    accent: 'text-brand-600 bg-brand-50 ring-brand-500',
  },
  {
    id: 'officer' as const,
    icon: ShieldCheck,
    title: 'Enforcement officer',
    body: 'Record field inspections, build cited case files, and track violation hotspots on a map.',
    accent: 'text-info-base bg-info-soft ring-info-base',
  },
  {
    id: 'manufacturer' as const,
    icon: Factory,
    title: 'Manufacturer',
    body: 'Pre-check artwork before a print run and catch missing declarations early.',
    accent: 'text-ink-700 bg-ink-100 ring-ink-700',
  },
]

export default function RoleSelect() {
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
        <h1 className="font-display text-3xl tracking-[-0.025em]">How will you use it?</h1>
        <p className="mt-2 text-md leading-relaxed text-ink-500">
          This tailors your home screen and available tools. You can change it later in Profile.
        </p>

        <div role="radiogroup" aria-label="Select your role" className="stagger mt-7 space-y-3">
          {roles.map(({ id, icon: Icon, title, body, accent }) => {
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
                  <span className="block text-md font-semibold text-ink-900">{title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-ink-500">{body}</span>
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
          Continue
          <ArrowRight size={18} strokeWidth={2.2} aria-hidden />
        </button>
      </div>
    </Screen>
  )
}
