import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { useNavigate } from 'react-router-dom'
import { Bell, ClipboardList, Map, TriangleAlert, ShieldCheck, ChevronRight, TrendingUp } from 'lucide-react'
import { Screen, ScrollArea, AppBar, IconButton, SectionHeader, Stat } from '../components/UI'
import BottomNav from '../components/BottomNav'
import { useApp } from '../store/app'
import { fetchHotspots, fetchOffenders, summarise, type OfficerSummary } from '../lib/officer'




export default function OfficerDashboard() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const user = useApp((s) => s.user)
  const scans = useApp((s) => s.scans)
  const [summary, setSummary] = useState<OfficerSummary | null>(null)
  const [topHotspots, setTopHotspots] = useState<{ district: string; violations: number }[]>([])
  const [live, setLive] = useState(false)

  useEffect(() => {
    let cancelled = false
    void Promise.all([fetchHotspots(), fetchOffenders()]).then(([h, o]) => {
      if (cancelled) return
      setSummary(summarise(h.data, o.data))
      setTopHotspots(h.data.slice(0, 3))
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
    time: relativeTime(s.createdAt, t),
  }))

  return (
    <Screen>
      <AppBar
        title={<span className="text-md font-semibold">{user?.name || 'Inspector'}</span>}
        subtitle={t(live ? 'officer.circleAll' : 'officer.circleLocal')}
        right={<IconButton icon={Bell} label={t('home.notifications')} />}
      />

      <ScrollArea className="pb-6">
        {/* --------------------------------------------------------- headline */}
        <section className="gutter pt-4">
          <div className="card p-4">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <p className="eyebrow">{t('officer.complianceRate')}</p>
                <p className="mt-1.5 font-display text-3xl font-semibold text-ink-900 tnum">
                  {summary ? `${complianceRate}%` : '—'}
                </p>
              </div>
              {summary && (
                <span className="inline-flex items-center gap-1 rounded-md bg-ink-100 px-2 py-1 text-xs font-semibold text-ink-600 tnum">
                  <TrendingUp size={13} strokeWidth={2.4} aria-hidden />
                  {t('officer.inspectionCount', { count: summary.totalScans })}
                </span>
              )}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-ink-500">
              {t('officer.rateExplainer')}
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------------ stats */}
        <section className="gutter pt-5">
          <div className="grid grid-cols-3 gap-2.5">
            <Stat
              value={summary ? summary.totalScans.toLocaleString('en-IN') : '—'}
              label={t('officer.inspections')}
              icon={ClipboardList}
            />
            <Stat
              value={summary ? Math.max(0, summary.totalScans - summary.violations).toLocaleString('en-IN') : '—'}
              label={t('home.compliant')}
              tone="ok"
              icon={ShieldCheck}
            />
            <Stat
              value={summary ? summary.violations.toLocaleString('en-IN') : '—'}
              label={t('home.violations')}
              tone="bad"
              icon={TriangleAlert}
            />
          </div>
        </section>

        {/* ---------------------------------------------------------- hotspots */}
        <section className="gutter pt-7">
          <SectionHeader title={t('officer.hotspots')} action={t('officer.openMap')} onAction={() => nav('/app/heatmap')} />
          <div className="card divide-y divide-ink-200 overflow-hidden">
            {topHotspots.map(({ district, violations: n }, i) => (
              <button
                key={district}
                type="button"
                onClick={() => nav('/app/heatmap')}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-ink-50"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-ink-100 font-display text-xs font-bold text-ink-600 tnum">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-md font-medium text-ink-900">{district}</span>
                <span className="shrink-0 text-sm font-semibold text-bad-base tnum">{n as number}</span>
                <ChevronRight size={16} className="shrink-0 text-ink-300" aria-hidden />
              </button>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------ recent cases */}
        <section className="gutter pt-7">
          <SectionHeader title={t('officer.recentInspections')} action={t('officer.allCases')} onAction={() => nav('/app/inspections')} />
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
                    <span className={bad ? 'badge-bad' : 'badge-ok'}>{t(bad ? 'officer.violation' : 'officer.clear')}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <div className="gutter pt-6">
          <button type="button" onClick={() => nav('/app/heatmap')} className="btn-secondary btn-block">
            <Map size={17} strokeWidth={2} aria-hidden />
            {t('officer.openMap')}
          </button>
        </div>
      </ScrollArea>

      <BottomNav />
    </Screen>
  )
}

/** "32 min ago" style formatting for the activity feed. */
function relativeTime(iso: string, t: TFunction): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return t('common.justNow')
  if (mins < 60) return t('common.minAgo', { count: mins })
  const hours = Math.round(mins / 60)
  if (hours < 24) return t('common.hourAgo', { count: hours })
  const days = Math.round(hours / 24)
  return t('common.dayAgo', { count: days })
}
