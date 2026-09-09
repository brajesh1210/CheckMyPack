import { type ReactNode, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Smartphone, ChevronDown, Languages } from 'lucide-react'
import { useApp, type Role } from '../store/app'

/* ----------------------------------------------------------- Quick Showcase Bar */

const SHOWCASE_SCREENS = [
  { id: '1', label: '1. Landing', path: '/' },
  { id: '2', label: '2. Login', path: '/login' },
  { id: '3', label: '3. Role Select', path: '/role' },
  { id: '4', label: '4. Consumer Dashboard', path: '/app/home', role: 'consumer' as Role },
  { id: '5', label: '5. Scan Product', path: '/app/scan' },
  { id: '6', label: '6. Scan Processing', path: '/app/processing' },
  { id: '7', label: '7. Retake Page', path: '/app/retake' },
  { id: '8', label: '8. Pass Result', path: '/app/result/CMP-1005-8403' },
  { id: '9', label: '9. Violation Result', path: '/app/result/CMP-1004-9214' },
  { id: '10', label: '10. Detailed Report', path: '/app/report/CMP-1005-8403' },
  { id: '11', label: '11. Officer Dashboard', path: '/app/officer', role: 'officer' as Role },
  { id: '12', label: '12. Violation Heatmap', path: '/app/heatmap', role: 'officer' as Role },
]

export function Screen({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const { role, setRole, lang, setLang } = useApp()
  const [showcaseOpen, setShowcaseOpen] = useState(false)

  const handleJump = (item: typeof SHOWCASE_SCREENS[0]) => {
    if (item.role) setRole(item.role)
    nav(item.path)
    setShowcaseOpen(false)
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-canvasWarm font-sans antialiased select-none">
      {/* -------------------------------- Desktop Showcase Switcher Bar */}
      <div className="hidden lg:flex fixed top-3 z-50 items-center gap-2 rounded-full border border-ink-200/80 bg-surface/95 px-4 py-1.5 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-1.5 border-r border-ink-200 pr-3">
          <Smartphone size={16} className="text-brand-600" aria-hidden />
          <span className="font-display text-xs font-bold text-ink-900">CheckMyPack Inspiration UI</span>
        </div>

        {/* Screen picker dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowcaseOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-800 hover:bg-ink-200"
          >
            <span>Jump to Screen</span>
            <ChevronDown size={14} aria-hidden />
          </button>

          {showcaseOpen && (
            <div className="absolute left-0 mt-2 w-64 rounded-2xl border border-ink-200 bg-surface p-2 shadow-2xl">
              <div className="max-h-80 overflow-y-auto space-y-1">
                {SHOWCASE_SCREENS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleJump(s)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium text-ink-800 hover:bg-brand-50 hover:text-brand-700"
                  >
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Language Toggle */}
        <button
          type="button"
          onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
          className="flex items-center gap-1 rounded-full border border-ink-200 px-2.5 py-1 text-xs font-semibold text-ink-700 hover:bg-ink-50"
        >
          <Languages size={14} aria-hidden />
          <span>{lang === 'en' ? 'English' : 'हिंदी'}</span>
        </button>

        {/* Role Quick Switcher */}
        <div className="flex items-center rounded-full bg-ink-100 p-0.5 text-2xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setRole('consumer')
              nav('/app/home')
            }}
            className={`rounded-full px-2.5 py-1 transition-colors ${
              role === 'consumer' ? 'bg-brand-500 text-white' : 'text-ink-600'
            }`}
          >
            Consumer
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('officer')
              nav('/app/officer')
            }}
            className={`rounded-full px-2.5 py-1 transition-colors ${
              role === 'officer' ? 'bg-blue-600 text-white' : 'text-ink-600'
            }`}
          >
            Officer
          </button>
        </div>
      </div>

      {/* ---------------------------------------- Mobile Phone Shell */}
      <div className={`shell ${className}`}>
        {/* Screen Content */}
        {children}
      </div>
    </div>
  )
}

export function ScrollArea({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`shell-scroll ${className}`}>{children}</div>
}

/* ----------------------------------------------------------- Header / AppBar */

export function AppBar({
  title,
  subtitle,
  back,
  onBack,
  right,
  border = true,
}: {
  title?: ReactNode
  subtitle?: string
  back?: boolean
  onBack?: () => void
  right?: ReactNode
  border?: boolean
}) {
  const nav = useNavigate()
  return (
    <header
      className={`sticky top-0 z-30 flex min-h-[60px] items-center gap-2 px-3 backdrop-blur-md bg-surface/90 ${
        border ? 'border-b border-ink-200/60' : ''
      }`}
    >
      {back && (
        <button
          type="button"
          onClick={() => (onBack ? onBack() : nav(-1))}
          aria-label="Go back"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-700 hover:bg-ink-100"
        >
          <ArrowLeft size={22} strokeWidth={2} aria-hidden />
        </button>
      )}
      <div className={`min-w-0 flex-1 ${back ? '' : 'pl-2'}`}>
        {title && (
          <h1 className="truncate font-display text-md font-bold text-ink-900">{title}</h1>
        )}
        {subtitle && (
          <p className="truncate text-xs text-ink-500">{subtitle}</p>
        )}
      </div>
      {right && <div className="flex shrink-0 items-center gap-1 pr-1">{right}</div>}
    </header>
  )
}

export function IconButton({
  icon: Icon,
  label,
  onClick,
  badge,
}: {
  icon: any
  label: string
  onClick?: () => void
  badge?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative grid h-11 w-11 place-items-center rounded-full text-ink-600 hover:bg-ink-100 hover:text-ink-900"
    >
      <Icon size={20} strokeWidth={2} aria-hidden />
      {!!badge && (
        <span
          className="absolute right-1.5 top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-bad-base px-1 text-2xs font-bold text-white tnum"
          aria-label={`${badge} unread`}
        >
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  )
}

export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="font-display text-md font-semibold text-ink-900">{title}</h2>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="tap -mr-2 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 active:bg-brand-50"
        >
          {action}
        </button>
      )}
    </div>
  )
}

export function Stat({
  value,
  label,
  tone = 'neutral',
  icon: Icon,
}: {
  value: string | number
  label: string
  tone?: 'neutral' | 'ok' | 'bad' | 'info'
  icon?: any
}) {
  const tones = {
    neutral: 'text-ink-900',
    ok: 'text-ok-base',
    bad: 'text-bad-base',
    info: 'text-info-base',
  }
  return (
    <div className="card px-2.5 py-3">
      {Icon && (
        <Icon size={16} strokeWidth={2} className={`mb-2 ${tones[tone]}`} aria-hidden />
      )}
      <div className={`font-display text-2xl font-semibold tnum ${tones[tone]}`}>{value}</div>
      <div className="mt-0.5 break-words text-xs leading-tight text-ink-500">{label}</div>
    </div>
  )
}

export function StatusPill({ state }: { state: 'PASS' | 'VIOLATION' | 'RETAKE' }) {
  const map = {
    PASS: { cls: 'badge-ok', text: 'Compliant' },
    VIOLATION: { cls: 'badge-bad', text: 'Violation' },
    RETAKE: { cls: 'badge-warn', text: 'Retake' },
  }[state]
  return <span className={map.cls}>{map.text}</span>
}

export function ListRow({
  icon: Icon,
  title,
  meta,
  right,
  onClick,
  danger,
}: {
  icon?: any
  title: string
  meta?: string
  right?: ReactNode
  onClick?: () => void
  danger?: boolean
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={`flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
        onClick ? 'hover:bg-ink-50 active:bg-ink-100' : ''
      }`}
    >
      {Icon && (
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
            danger ? 'bg-bad-soft text-bad-base' : 'bg-ink-100 text-ink-600'
          }`}
        >
          <Icon size={17} strokeWidth={1.9} aria-hidden />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-md font-medium ${danger ? 'text-bad-text' : 'text-ink-900'}`}>
          {title}
        </span>
        {meta && <span className="mt-0.5 block truncate text-xs text-ink-500">{meta}</span>}
      </span>
      {right}
    </Tag>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: any
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-8 py-14 text-center">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-ink-100 text-ink-400">
        <Icon size={24} strokeWidth={1.6} aria-hidden />
      </span>
      <h3 className="font-display text-md font-semibold text-ink-900">{title}</h3>
      <p className="mt-1.5 max-w-[36ch] text-sm leading-relaxed text-ink-500">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Divider({ label }: { label?: string }) {
  if (!label) return <div className="hr" />
  return (
    <div className="flex items-center gap-3" role="separator">
      <div className="hr flex-1" />
      <span className="text-xs font-medium text-ink-400">{label}</span>
      <div className="hr flex-1" />
    </div>
  )
}
