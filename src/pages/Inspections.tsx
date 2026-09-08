import { useMemo, useState } from 'react'
import { Search, MapPin, ChevronRight } from 'lucide-react'
import { Screen, ScrollArea, AppBar, EmptyState } from '../components/UI'
import BottomNav from '../components/BottomNav'

type Case = { id: string; product: string; brand: string; place: string; bad: boolean; date: string }

const cases: Case[] = [
  { id: 'INS-4471', product: 'Fortune Sunflower Oil', brand: 'Adani Wilmar', place: 'Karol Bagh, Delhi', bad: true, date: '08 Sep 2026' },
  { id: 'INS-4470', product: 'Amul Taaza Milk', brand: 'GCMMF', place: 'Sector 18, Noida', bad: false, date: '08 Sep 2026' },
  { id: 'INS-4469', product: 'Sunfeast Marie Light', brand: 'ITC', place: 'DLF Phase 3, Gurgaon', bad: false, date: '07 Sep 2026' },
  { id: 'INS-4468', product: 'Maggi 2-Minute Noodles', brand: 'Nestlé India', place: 'Lajpat Nagar, Delhi', bad: true, date: '07 Sep 2026' },
  { id: 'INS-4466', product: 'Aashirvaad Atta', brand: 'ITC', place: 'Dadar West, Mumbai', bad: false, date: '06 Sep 2026' },
  { id: 'INS-4465', product: 'Tata Salt', brand: 'Tata Consumer', place: 'Central, Rajkot', bad: false, date: '06 Sep 2026' },
]

const tabs = ['All', 'Violations', 'Cleared'] as const

export default function Inspections() {
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<(typeof tabs)[number]>('All')

  const list = useMemo(
    () =>
      cases.filter((c) => {
        const t = q.trim().toLowerCase()
        const mq = !t || c.product.toLowerCase().includes(t) || c.brand.toLowerCase().includes(t) || c.place.toLowerCase().includes(t)
        const mt = tab === 'All' || (tab === 'Violations' ? c.bad : !c.bad)
        return mq && mt
      }),
    [q, tab],
  )

  return (
    <Screen>
      <AppBar title="Case register" subtitle={`${cases.length} inspections logged`} />

      <ScrollArea className="pb-6">
        <div className="gutter pt-3">
          <div className="relative">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" aria-hidden />
            <input
              type="search"
              className="field pl-10"
              placeholder="Search product, brand or locality"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search inspections"
            />
          </div>

          <div className="mt-3 flex gap-2" role="tablist" aria-label="Filter cases">
            {tabs.map((t) => {
              const active = tab === t
              return (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t)}
                  className={`min-h-[36px] rounded-full px-3.5 text-sm font-medium transition-colors ${
                    active ? 'bg-ink-900 text-white' : 'border border-ink-200 bg-surface text-ink-600 hover:border-ink-300 hover:text-ink-900'
                  }`}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </div>

        <div className="gutter pt-5">
          {list.length === 0 ? (
            <div className="card">
              <EmptyState icon={Search} title="No matching cases" body="Try a different search term or switch the filter." />
            </div>
          ) : (
            <ul className="stagger space-y-2.5">
              {list.map((c) => (
                <li key={c.id}>
                  <button type="button" className="card-interactive flex w-full items-start gap-3 p-4 text-left">
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-md font-medium text-ink-900">{c.product}</span>
                        <span className={c.bad ? 'badge-bad' : 'badge-ok'}>{c.bad ? 'Violation' : 'Clear'}</span>
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
