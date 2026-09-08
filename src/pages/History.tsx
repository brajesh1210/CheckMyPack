import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ShieldCheck, TriangleAlert, ScanLine, ChevronRight } from 'lucide-react'
import { Screen, ScrollArea, AppBar, StatusPill, EmptyState } from '../components/UI'
import BottomNav from '../components/BottomNav'
import { useApp } from '../store/app'

const filters = ['All', 'Compliant', 'Violations'] as const

export default function History() {
  const nav = useNavigate()
  const scans = useApp((s) => s.scans)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<(typeof filters)[number]>('All')

  const list = useMemo(
    () =>
      scans.filter((s) => {
        const matchQ = s.product.toLowerCase().includes(q.trim().toLowerCase())
        const matchF =
          filter === 'All' ||
          (filter === 'Violations' ? s.state === 'VIOLATION' : s.state === 'PASS')
        return matchQ && matchF
      }),
    [scans, q, filter],
  )

  return (
    <Screen>
      <AppBar title="Scan history" subtitle={`${scans.length} records stored on this device`} />

      <ScrollArea className="pb-6">
        {/* -------------------------------------------------------- search */}
        <div className="gutter pt-3">
          <div className="relative">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" aria-hidden />
            <input
              type="search"
              className="field pl-10"
              placeholder="Search by product name"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search scan history"
            />
          </div>

          <div className="mt-3 flex gap-2" role="tablist" aria-label="Filter scans">
            {filters.map((f) => {
              const active = filter === f
              return (
                <button
                  key={f}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`min-h-[36px] rounded-full px-3.5 text-sm font-medium transition-colors duration-150 ${
                    active
                      ? 'bg-ink-900 text-white'
                      : 'border border-ink-200 bg-surface text-ink-600 hover:border-ink-300 hover:text-ink-900'
                  }`}
                >
                  {f}
                </button>
              )
            })}
          </div>
        </div>

        {/* --------------------------------------------------------- list */}
        <div className="gutter pt-5">
          {list.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={ScanLine}
                title="Nothing matches"
                body={q ? `No scan named “${q}”. Try a different search or clear the filter.` : 'No scans in this category yet.'}
                action={
                  <button type="button" onClick={() => { setQ(''); setFilter('All') }} className="btn-secondary btn-sm">
                    Clear filters
                  </button>
                }
              />
            </div>
          ) : (
            <ul className="stagger space-y-2.5">
              {list.map((s) => {
                const bad = s.state === 'VIOLATION'
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => nav(`/app/result?demo=${bad ? 'violation' : 'pass'}`)}
                      className="card-interactive flex w-full items-center gap-3.5 p-3.5 text-left"
                    >
                      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${bad ? 'bg-bad-soft text-bad-base' : 'bg-ok-soft text-ok-base'}`}>
                        {bad ? <TriangleAlert size={19} strokeWidth={1.9} aria-hidden /> : <ShieldCheck size={19} strokeWidth={1.9} aria-hidden />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-md font-medium text-ink-900">{s.product}</span>
                          <StatusPill state={s.state} />
                        </span>
                        <span className="mt-1 block truncate text-xs text-ink-500 tnum">
                          {s.id} · {s.date}
                        </span>
                      </span>
                      <ChevronRight size={18} className="shrink-0 text-ink-300" aria-hidden />
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
