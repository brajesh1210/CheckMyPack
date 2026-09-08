import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ShieldCheck, TriangleAlert, ScanLine, ChevronRight, ScanSearch, CloudOff, Trash2 } from 'lucide-react'
import { Screen, ScrollArea, AppBar, StatusPill, EmptyState } from '../components/UI'
import BottomNav from '../components/BottomNav'
import { useApp } from '../store/app'

const filters = ['All', 'Compliant', 'Violations', 'Retakes'] as const

export default function History() {
  const nav = useNavigate()
  const { scans, removeScan } = useApp()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<(typeof filters)[number]>('All')

  const list = useMemo(
    () =>
      scans.filter((s) => {
        const matchQ = s.productName.toLowerCase().includes(q.trim().toLowerCase()) || s.id.toLowerCase().includes(q.trim().toLowerCase())
        const matchF =
          filter === 'All' ||
          (filter === 'Violations' && s.verdict === 'VIOLATION') ||
          (filter === 'Compliant' && s.verdict === 'PASS') ||
          (filter === 'Retakes' && s.verdict === 'RETAKE')
        return matchQ && matchF
      }),
    [scans, q, filter],
  )

  const unsynced = scans.filter((s) => !s.synced).length

  return (
    <Screen>
      <AppBar title="Scan history" subtitle={`${scans.length} stored on this device`} />

      <ScrollArea className="pb-6">
        {scans.length > 0 && (
          <div className="gutter pt-3">
            <div className="relative">
              <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" aria-hidden />
              <input
                type="search"
                className="field pl-10"
                placeholder="Search product or reference"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Search scan history"
              />
            </div>

            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto" role="tablist" aria-label="Filter scans">
              {filters.map((f) => {
                const active = filter === f
                return (
                  <button
                    key={f}
                    role="tab"
                    aria-selected={active}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`min-h-[36px] shrink-0 rounded-full px-3.5 text-sm font-medium transition-colors ${
                      active ? 'bg-ink-900 text-white' : 'border border-ink-200 bg-surface text-ink-600 hover:border-ink-300 hover:text-ink-900'
                    }`}
                  >
                    {f}
                  </button>
                )
              })}
            </div>

            {unsynced > 0 && (
              <p className="mt-3 flex items-center gap-2 rounded-lg bg-warn-soft px-3 py-2 text-xs text-warn-text">
                <CloudOff size={14} className="shrink-0" aria-hidden />
                {unsynced} {unsynced === 1 ? 'scan is' : 'scans are'} stored locally and will sync when a server is configured.
              </p>
            )}
          </div>
        )}

        <div className="gutter pt-5">
          {scans.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={ScanLine}
                title="No scans yet"
                body="Every pack you scan is saved here, including offline ones."
                action={
                  <button type="button" onClick={() => nav('/app/scan')} className="btn-primary btn-sm">
                    Scan a pack
                  </button>
                }
              />
            </div>
          ) : list.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={Search}
                title="Nothing matches"
                body="Try a different search term or clear the filter."
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
                        className={`grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg ${
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
                          {s.id} · {new Date(s.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </span>
                      <ChevronRight size={18} className="shrink-0 text-ink-300" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeScan(s.id)}
                      aria-label={`Delete scan of ${s.productName}`}
                      className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-ink-300 transition-colors hover:bg-bad-soft hover:text-bad-base"
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
