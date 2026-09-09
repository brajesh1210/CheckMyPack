import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ClipboardList, Map, TriangleAlert, ShieldCheck, ChevronRight, TrendingUp } from 'lucide-react'
import { Screen, ScrollArea, AppBar, IconButton, SectionHeader, Stat } from '../components/UI'
import BottomNav from '../components/BottomNav'
import { useApp } from '../store/app'
import { fetchHotspots, fetchOffenders, summarise, type OfficerSummary } from '../lib/officer'

const trend = [88.4, 90.1, 89.6, 92.3, 93.8, 94.1, 95.6, 96.2]
const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']

function Sparkline() {
  const w = 320
  const h = 92
  const min = 86
  const max = 98
  const pts = trend.map((v, i) => {
    const x = (i / (trend.length - 1)) * w
    const y = h - ((v - min) / (max - min)) * h
    return [x, y] as const
  })
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${w},${h} L0,${h} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[92px] w-full" role="img" aria-label="Compliance rate rose from 88.4% in February to 96.2% in September">
      <defs>
        <linearGradient id="cmp-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2E7D32" stopOpacity="0.20" />
          <stop offset="100%" stopColor="#2E7D32" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" y1={h * f} x2={w} y2={h * f} stroke="#E2E5E2" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#cmp-fill)" />
      <path d={line} fill="none" stroke="#2E7D32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0] - 1.5} cy={pts[pts.length - 1][1]} r="3.6" fill="#2E7D32" stroke="#fff" strokeWidth="2" />
    </svg>
  )
}

export default function OfficerDashboard() {
  const nav = useNavigate()
  const user = useApp((s) => s.user)
  const scans = useApp((s) => s.scans)
  const [summary, setSummary] = useState<OfficerSummary | null>(null)
  const [live, setLive] = useState(false)

  useEffect(() => {
    let cancelled = false
    void Promise.all([fetchHotspots(), fetchOffenders()]).then(([h, o]) => {
      if (cancelled) return
      setSummary(summarise(h.data, o.data))
      setLive(h.live && o.live)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // The compliance rate is the inverse of the violation rate.
  const complianceRate = summary ? (100 - summary.violationRate).toFixed(1) : '—'

  // The three most recent scans on this device, shown as the officer's own
  // activity feed. Aggregate views are deliberately not drillable to
  // individual rows.
  const recent = scans.slice(0, 3).map((s) => ({
    id: s.id,
    place: s.place,
    status: s.verdict,
    time: relativeTime(s.createdAt),
  }))

  return (
    <Screen>
      <AppBar
        title={<span className="text-md font-semibold">{user?.name || 'Inspector'}</span>}
        subtitle={live ? 'Legal Metrology · all districts' : 'Legal Metrology · this device'}
        right={<IconButton icon={Bell} label="Notifications" badge={5} />}
      />

      <ScrollArea className="pb-6">
        {/* --------------------------------------------------------- headline */}
        <section className="gutter pt-4">
          <div className="card p-4">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <p className="eyebrow">Compliance rate</p>
                <p className="mt-1.5 font-display text-3xl font-semibold text-ink-900 tnum">
                  {summary ? `${complianceRate}%` : '—'}
                </p>
              </div>
              {summary && (
                <span className="inline-flex items-center gap-1 rounded-md bg-ink-100 px-2 py-1 text-xs font-semibold text-ink-600 tnum">
                  <TrendingUp size={13} strokeWidth={2.4} aria-hidden />
                  {summary.totalScans} {summary.totalScans === 1 ? 'inspection' : 'inspections'}
                </span>
              )}
            </div>
            <div className="mt-4">
              <Sparkline />
              <div className="mt-1.5 flex justify-between text-2xs text-ink-400 tnum">
                {months.map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ stats */}
        <section className="gutter pt-5">
          <div className="grid grid-cols-3 gap-2.5">
            <Stat value="8,432" label="Inspections" icon={ClipboardList} />
            <Stat value="9,621" label="Compliant" tone="ok" icon={ShieldCheck} />
            <Stat value="811" label="Violations" tone="bad" icon={TriangleAlert} />
          </div>
        </section>

        {/* ---------------------------------------------------------- hotspots */}
        <section className="gutter pt-7">
          <SectionHeader title="Violation hotspots" action="Open map" onAction={() => nav('/app/heatmap')} />
          <div className="card divide-y divide-ink-200 overflow-hidden">
            {[
              ['Mumbai — Dadar', 132],
              ['Delhi — Dwarka', 84],
              ['Rajkot — Central', 74],
            ].map(([place, n], i) => (
              <button
                key={place as string}
                type="button"
                onClick={() => nav('/app/heatmap')}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-ink-50"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-ink-100 font-display text-xs font-bold text-ink-600 tnum">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-md font-medium text-ink-900">{place as string}</span>
                <span className="shrink-0 text-sm font-semibold text-bad-base tnum">{n as number}</span>
                <ChevronRight size={16} className="shrink-0 text-ink-300" aria-hidden />
              </button>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------ recent cases */}
        <section className="gutter pt-7">
          <SectionHeader title="Recent inspections" action="All cases" onAction={() => nav('/app/inspections')} />
          <ul className="space-y-2.5">
            {recent.map((r) => {
              const bad = r.status === 'VIOLATION'
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => nav('/app/inspections')}
                    className="card-interactive flex w-full items-center gap-3.5 p-3.5 text-left"
                  >
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${bad ? 'bg-bad-soft text-bad-base' : 'bg-ok-soft text-ok-base'}`}>
                      {bad ? <TriangleAlert size={18} strokeWidth={1.9} aria-hidden /> : <ShieldCheck size={18} strokeWidth={1.9} aria-hidden />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-md font-medium text-ink-900">{r.place}</span>
                      <span className="mt-0.5 block truncate text-xs text-ink-500 tnum">{r.id} · {r.time}</span>
                    </span>
                    <span className={bad ? 'badge-bad' : 'badge-ok'}>{bad ? 'Violation' : 'Clear'}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <div className="gutter pt-6">
          <button type="button" onClick={() => nav('/app/heatmap')} className="btn-secondary btn-block">
            <Map size={17} strokeWidth={2} aria-hidden />
            Open enforcement map
          </button>
        </div>
      </ScrollArea>

      <BottomNav />
    </Screen>
  )
}

/** "32 min ago" style formatting for the activity feed. */
function relativeTime(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  const days = Math.round(hours / 24)
  return `${days} ${days === 1 ? 'day' : 'days'} ago`
}
