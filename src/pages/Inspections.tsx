import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, MapPin, ChevronRight } from 'lucide-react'
import { Screen, ScrollArea, AppBar, EmptyState } from '../components/UI'
import BottomNav from '../components/BottomNav'
import { useApp } from '../store/app'

type Case = { id: string; product: string; brand: string; place: string; bad: boolean; date: string }


const tabs = [
  ['all', 'officer.filterAll'],
  ['violations', 'officer.filterViolations'],
  ['cleared', 'officer.filterCleared'],
] as const

export default function Inspections() {
  const { t } = useTranslation()
  const scans = useApp((s) => s.scans)
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<'all' | 'violations' | 'cleared'>('all')

  // The register is the officer's own recorded inspections. Aggregate views
  // are deliberately not drillable to individual rows filed by other users.
  const cases: Case[] = useMemo(
    () =>
      scans
        .filter((s) => s.verdict !== 'RETAKE')
        .map((s) => ({
          id: s.id,
          product: s.productName,
          brand: s.productName.split(/\s+/).slice(0, 2).join(' '),
          place: s.place,
          bad: s.verdict === 'VIOLATION',
          date: new Date(s.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
        })),
    [scans],
  )

  const list = useMemo(
    () =>
      cases.filter((c) => {
        const needle = q.trim().toLowerCase()
        const mq =
          !needle ||
          c.product.toLowerCase().includes(needle) ||
          c.brand.toLowerCase().includes(needle) ||
          c.place.toLowerCase().includes(needle)
        const mt = tab === 'all' || (tab === 'violations' ? c.bad : !c.bad)
        return mq && mt
      }),
    [cases, q, tab],
  )

  return (
    <Screen>
      <AppBar title={t('officer.caseRegister')} subtitle={t('officer.inspectionsLogged', { count: cases.length })} />

      <ScrollArea className="pb-6">
        <div className="gutter pt-3">
          <div className="relative">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" aria-hidden />
            <input
              type="search"
              className="field pl-10"
              placeholder={t('officer.searchCases')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label={t('officer.ariaSearchCases')}
            />
          </div>

          <div className="mt-3 flex gap-2" role="tablist" aria-label={t('officer.ariaFilterCases')}>
            {tabs.map(([value, labelKey]) => {
              const active = tab === value
              return (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(value)}
                  className={`min-h-[36px] rounded-full px-3.5 text-sm font-medium transition-colors ${
                    active ? 'bg-ink-900 text-white' : 'border border-ink-200 bg-surface text-ink-600 hover:border-ink-300 hover:text-ink-900'
                  }`}
                >
                  {t(labelKey)}
                </button>
              )
            })}
          </div>
        </div>

        <div className="gutter pt-5">
          {list.length === 0 ? (
            <div className="card">
              <EmptyState icon={Search} title={t('officer.noMatchingCases')} body={t('officer.tryDifferentSearch')} />
            </div>
          ) : (
            <ul className="stagger space-y-2.5">
              {list.map((c) => (
                <li key={c.id}>
                  <button type="button" className="card-interactive flex w-full items-start gap-3 p-4 text-left">
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-md font-medium text-ink-900">{c.product}</span>
                        <span className={c.bad ? 'badge-bad' : 'badge-ok'}>{t(c.bad ? 'officer.violation' : 'officer.clear')}</span>
                      </span>
                      <span className="mt-1 block truncate text-xs text-ink-500">{c.brand}</span>
                      <span className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-500">
                        <MapPin size={12} strokeWidth={2} className="shrink-0 text-ink-400" aria-hidden />
                        <span className="truncate">{c.place}</span>
                        <span className="text-ink-300">·</span>
                        <span className="shrink-0 tnum">{c.date}</span>
                      </span>
                    </span>
                    <ChevronRight size={18} className="mt-0.5 shrink-0 text-ink-300" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </ScrollArea>

      <BottomNav />
    </Screen>
  )
}
