import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Home, ScanLine, History, User, LayoutGrid, Map, ClipboardList,
  FileText, Settings, Camera, type LucideIcon
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../store/app'

type Item = { to: string; labelKey: string; icon: LucideIcon; isCenter?: boolean }

const consumerNav: Item[] = [
  { to: '/app/home', labelKey: 'nav.home', icon: Home },
  { to: '/app/scan', labelKey: 'nav.scan', icon: ScanLine },
  { to: '/app/history', labelKey: 'nav.history', icon: History },
  { to: '/app/profile', labelKey: 'nav.profile', icon: User },
]

const officerNav: Item[] = [
  { to: '/app/officer', labelKey: 'nav.overview', icon: LayoutGrid },
  { to: '/app/heatmap', labelKey: 'nav.map', icon: Map },
  { to: '/app/scan', labelKey: 'nav.scan', icon: Camera, isCenter: true },
  { to: '/app/reports', labelKey: 'nav.reports', icon: FileText },
  { to: '/app/profile', labelKey: 'nav.settings', icon: Settings },
]

export default function BottomNav() {
  const { t } = useTranslation()
  const role = useApp((s) => s.role)
  const nav = useNavigate()
  const { pathname } = useLocation()
  const items = role === 'officer' ? officerNav : consumerNav

  return (
    <nav
      aria-label="Primary"
      className="safe-b relative z-30 shrink-0 border-t border-ink-200/80 bg-surface/95 shadow-nav backdrop-blur-md"
    >
      <ul className="flex items-center justify-around px-2 py-1">
        {items.map(({ to, labelKey, icon: Icon, isCenter }) => {
          const active = pathname === to

          if (isCenter) {
            return (
              <li key={to} className="relative -top-3">
                <button
                  type="button"
                  onClick={() => nav(to)}
                  aria-label={t(labelKey)}
                  className="grid h-14 w-14 place-items-center rounded-full bg-brand-500 text-white shadow-lg transition-transform active:scale-95 hover:bg-brand-600"
                >
                  <Icon size={24} strokeWidth={2.4} aria-hidden />
                </button>
              </li>
            )
          }

          return (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                aria-current={active ? 'page' : undefined}
                className="relative flex min-h-[54px] flex-col items-center justify-center gap-1 py-1 text-center transition-colors"
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.4 : 1.8}
                  className={`transition-colors duration-200 ${
                    active ? 'text-brand-600' : 'text-ink-400'
                  }`}
                  aria-hidden
                />
                <span
                  className={`text-2xs leading-tight transition-colors duration-200 ${
                    active ? 'font-bold text-brand-700' : 'font-medium text-ink-500'
                  }`}
                >
                  {t(labelKey)}
                </span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
