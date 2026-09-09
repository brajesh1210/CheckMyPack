import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Search, ShieldCheck, TriangleAlert, ScanLine, ChevronRight, ScanSearch, Trash2 } from 'lucide-react'
import { Screen, ScrollArea, AppBar, StatusPill, EmptyState } from '../components/UI'
import BottomNav from '../components/BottomNav'
import { useApp } from '../store/app'

const filters = [['all','history.filterAll'],['compliant','history.filterCompliant'],['violations','history.filterViolations'],['retakes','history.filterRetakes']] as const

export default function History() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { scans, removeScan } = useApp()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'compliant' | 'violations' | 'retakes'>('all')

  const list = useMemo(
    () =>
      scans.filter((s) => {
        const matchQ = s.productName.toLowerCase().includes(q.trim().toLowerCase()) || s.id.toLowerCase().includes(q.trim().toLowerCase())
        const matchF =
          filter === 'all' ||
          (filter === 'violations' && s.verdict === 'VIOLATION') ||
          (filter === 'compliant' && s.verdict === 'PASS') ||
          (filter === 'retakes' && s.verdict === 'RETAKE')
        return matchQ && matchF
      }),
    [scans, q, filter],
  )

  return (
    <Screen>
      <AppBar title={t('history.title')} subtitle={`${scans.length} stored`} />

      <ScrollArea className="pb-6">
        {scans.length > 0 && (
          <div className="gutter pt-3">
            <div className="relative">
              <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" aria-hidden />
              <input
                type="search"
                className="field pl-10"
                placeholder={t('history.search')}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label={t('history.ariaSearch')}
              />
            </div>

            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto" role="tablist" aria-label={t('history.ariaFilter')}>
              {filters.map(([value, labelKey]) => {
                const active = filter === value
                return (
                  <button
                    key={value}
                    role="tab"
                    aria-selected={active}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={`min-h-[44px] shrink-0 rounded-full px-4 text-sm font-medium transition-colors ${
                      active ? 'bg-ink-900 text-white' : 'border border-ink-200 bg-surface text-ink-600 hover:border-ink-300 hover:text-ink-900'
                    }`}
                  >
                    {t(labelKey)}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="gutter pt-5">
          {scans.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={ScanLine}
                title={t('home.noScans')}
                body={t('history.noScansBody')}
                action={
                  <button type="button" onClick={() => nav('/app/scan')} className="btn-primary btn-sm">
                    {t('result.scanAPack')}
                  </button>
                }
              />
            </div>
          ) : list.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={Search}
                title={t('history.nothingMatches')}
                body={t('history.nothingMatchesBody')}
                action={
                  <button type="button" onClick={() => { setQ(''); setFilter('all') }} className="btn-secondary btn-sm">
                    {t('history.clearFilters')}
                  </button>
                }
              />
            </div>
          ) : (
            <ul className="stagger space-y-2.5">
              {list.map((s) => {
                const bad = s.verdict === 'VIOLATION'
                const retake = s.verdict === 'RETAKE'
                return (
                  <li key={s.id} className="relative">
                    <button
                      type="button"
                      onClick={() => nav(retake ? '/app/retake' : `/app/result/${s.id}`)}
                      className="card-interactive flex w-full items-center gap-3.5 p-3.5 pr-12 text-left"
                    >
                      <span
                        className={`grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl ${
                          retake ? 'bg-warn-soft text-warn-base' : bad ? 'bg-bad-soft text-bad-base' : 'bg-ok-soft text-ok-base'
                        }`}
                      >
                        {retake ? (
                          <ScanSearch size={19} strokeWidth={1.9} aria-hidden />
                        ) : bad ? (
                          <TriangleAlert size={19} strokeWidth={1.9} aria-hidden />
                        ) : (
                          <ShieldCheck size={19} strokeWidth={1.9} aria-hidden />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-md font-medium text-ink-900">{s.productName}</span>
                          <StatusPill state={s.verdict} />
                        </span>
                        <span className="mt-1 block truncate text-xs text-ink-500 tnum">
                          {s.id} · {new Date(s.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </span>
                      <ChevronRight size={18} className="shrink-0 text-ink-300" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeScan(s.id)}
                      aria-label="Delete"
                      className="absolute right-0.5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg text-ink-300 transition-colors hover:bg-bad-soft hover:text-bad-base"
                    >
                      <Trash2 size={15} strokeWidth={1.9} aria-hidden />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </ScrollArea>

      <BottomNav />
    </Screen>
  )
}
