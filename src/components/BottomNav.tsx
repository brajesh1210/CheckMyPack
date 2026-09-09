import { NavLink, useLocation } from 'react-router-dom'
import { Home, ScanLine, History, FileWarning, User, LayoutGrid, Map, ClipboardList, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../store/app'

type Item = { to: string; labelKey: string; icon: LucideIcon }

const consumerNav: Item[] = [
  { to: '/app/home', labelKey: 'nav.home', icon: Home },
  { to: '/app/scan', labelKey: 'nav.scan', icon: ScanLine },
  { to: '/app/history', labelKey: 'nav.history', icon: History },
  { to: '/app/complaint', labelKey: 'nav.complaint', icon: FileWarning },
  { to: '/app/profile', labelKey: 'nav.profile', icon: User },
]

const officerNav: Item[] = [
  { to: '/app/officer', labelKey: 'officer.dashboard', icon: LayoutGrid },
  { to: '/app/scan', labelKey: 'nav.scan', icon: ScanLine },
  { to: '/app/heatmap', labelKey: 'nav.map', icon: Map },
  { to: '/app/inspections', labelKey: 'nav.cases', icon: ClipboardList },
  { to: '/app/profile', labelKey: 'nav.profile', icon: User },
]

export default function BottomNav() {
  const { t } = useTranslation()
  const role = useApp((s) => s.role)
  const { pathname } = useLocation()
  const items = role === 'officer' ? officerNav : consumerNav

  return (
    <nav
      aria-label="Primary"
      className="safe-b relative z-30 shrink-0 border-t border-ink-200 bg-surface/95 shadow-nav backdrop-blur-md"
    >
      <ul className="flex items-stretch">
        {items.map(({ to, labelKey, icon: Icon }) => {
          const active = pathname === to
          return (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                aria-current={active ? 'page' : undefined}
                className="relative flex min-h-[60px] flex-col items-center justify-center gap-1 pb-1 pt-2.5 transition-colors"
              >
                {/* active top indicator — 3px bar, spatially anchored */}
                <span
                  aria-hidden
                  className={`absolute inset-x-4 top-0 h-[3px] rounded-b-full bg-brand-500 transition-all duration-300 ease-out ${
                    active ? 'opacity-100' : 'scale-x-0 opacity-0'
                  }`}
                />
                <Icon
                  size={21}
                  strokeWidth={active ? 2.3 : 1.8}
                  className={`transition-colors duration-200 ${active ? 'text-brand-600' : 'text-ink-400'}`}
                  aria-hidden
                />
                <span
                  className={`text-2xs leading-none transition-colors duration-200 ${
                    active ? 'font-semibold text-brand-700' : 'font-medium text-ink-500'
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
