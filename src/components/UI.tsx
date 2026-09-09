import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, type LucideIcon } from 'lucide-react'

/* ------------------------------------------------------------------ Shell */

export function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`shell ${className}`}>{children}</div>
}

export function ScrollArea({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`shell-scroll ${className}`}>{children}</div>
}

/* ----------------------------------------------------------------- Header */

export function AppBar({
  title,
  subtitle,
  back,
  onBack,
  right,
  tone = 'light',
  border = true,
}: {
  title?: ReactNode
  subtitle?: string
  back?: boolean
  onBack?: () => void
  right?: ReactNode
  tone?: 'light' | 'dark'
  border?: boolean
}) {
  const nav = useNavigate()
  const dark = tone === 'dark'
  return (
    <header
      className={`sticky top-0 z-30 flex min-h-[60px] items-center gap-2 px-3 backdrop-blur-md ${
        dark ? 'bg-ink-900/80 text-white' : 'bg-canvas/85'
      } ${border && !dark ? 'hairline' : ''}`}
    >
      {back && (
        <button
          type="button"
          onClick={() => (onBack ? onBack() : nav(-1))}
          aria-label="Go back"
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors ${
            dark ? 'hover:bg-white/10' : 'hover:bg-ink-100'
          }`}
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
      )}
      <div className={`min-w-0 flex-1 ${back ? '' : 'pl-2'}`}>
        {title && (
          <h1 className={`truncate font-display text-lg font-semibold ${dark ? 'text-white' : ''}`}>{title}</h1>
        )}
        {subtitle && (
          <p className={`truncate text-xs ${dark ? 'text-white/60' : 'text-ink-500'}`}>{subtitle}</p>
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
  tone = 'light',
}: {
  icon: LucideIcon
  label: string
  onClick?: () => void
  badge?: number
  tone?: 'light' | 'dark'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`relative grid h-11 w-11 place-items-center rounded-full transition-colors ${
        tone === 'dark' ? 'text-white hover:bg-white/10' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
      }`}
    >
      <Icon size={20} strokeWidth={1.9} aria-hidden />
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

/* ------------------------------------------------------------- Primitives */

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
  icon?: LucideIcon
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
      {/* Three-up stat rows get very narrow on a 320px phone, so let the
          label wrap rather than clip. */}
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
  icon?: LucideIcon
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
  icon: LucideIcon
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
