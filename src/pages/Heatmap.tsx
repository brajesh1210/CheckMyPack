import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Layers, Info } from 'lucide-react'
import { Screen, ScrollArea, AppBar } from '../components/UI'
import BottomNav from '../components/BottomNav'
import { fetchHotspots, plottable, tierFor, type PlottedHotspot } from '../lib/officer'

type Spot = PlottedHotspot & { city: string; n: number }

const tierColor = { high: 'var(--cmp-bad)', medium: 'var(--cmp-warn)', low: 'var(--cmp-ok)' } as const

export default function Heatmap() {
  const { t } = useTranslation()
  const [spots, setSpots] = useState<Spot[]>([])
  const [live, setLive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sel, setSel] = useState<Spot | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetchHotspots().then(({ data, live }) => {
      if (cancelled) return
      const plotted = plottable(data).map((h) => ({
        ...h,
        city: h.district,
        n: h.violations,
      }))
      setSpots(plotted)
      setLive(live)
      setSel(plotted[0] ?? null)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Screen>
      <AppBar
        title={t('officer.mapTitle')}
        subtitle={
          loading
            ? t('officer.mapLoading')
            : live
              ? t('officer.mapLive')
              : t('officer.mapLocal')
        }
      />

      <ScrollArea className="pb-6">
        {/* ------------------------------------------------------------- map */}
        <div className="gutter pt-4">
          <div className="relative overflow-hidden rounded-xl border border-ink-200 bg-info-soft/40">
            <svg viewBox="0 0 100 105" className="block w-full" role="img" aria-label={t('officer.mapAria')}>
              {/* stylised landmass — schematic, not a survey map */}
              <path
                d="M34 12 L44 8 L54 13 L62 11 L70 17 L78 16 L84 24 L88 34 L83 41 L86 47 L79 52 L74 49 L72 56 L66 62 L60 74 L54 86 L48 96 L42 88 L38 78 L33 70 L27 64 L21 56 L17 47 L14 38 L18 30 L24 24 L28 16 Z"
                fill="var(--cmp-map-fill)"
                stroke="var(--cmp-map-line)"
                strokeWidth="0.8"
                strokeLinejoin="round"
              />
              {/* heat halos */}
              {spots.map((s) => {
                const t = tierFor(s.violationRate)
                return (
                  <circle
                    key={`halo-${s.district}`}
                    cx={s.x}
                    cy={s.y}
                    r={Math.max(4, s.n / 14)}
                    fill={tierColor[t]}
                    opacity={0.16}
                  />
                )
              })}
              {/* markers */}
              {spots.map((s) => {
                const t = tierFor(s.violationRate)
                const active = sel?.district === s.district
                return (
                  <g key={s.district} onClick={() => setSel(s)} style={{ cursor: 'pointer' }}>
                    <circle cx={s.x} cy={s.y} r={active ? 3.2 : 2.3} fill={tierColor[t]} stroke="#fff" strokeWidth={active ? 1.2 : 0.9} />
                    {/* generous invisible hit area */}
                    <circle cx={s.x} cy={s.y} r="7" fill="transparent" />
                  </g>
                )
              })}
            </svg>

            {/* legend */}
            <div className="absolute bottom-2.5 left-2.5 rounded-lg bg-surface/95 px-2.5 py-2 shadow-sm backdrop-blur">
              <p className="mb-1.5 text-2xs font-semibold uppercase tracking-[0.06em] text-ink-500">{t('officer.violationRate')}</p>
              <ul className="space-y-1">
                {[
                  ['high', '50%+ of scans'],
                  ['medium', '20–49%'],
                  ['low', 'under 20%'],
                ].map(([t, label]) => (
                  <li key={t} className="flex items-center gap-1.5 text-2xs text-ink-600">
                    <span className="h-2 w-2 rounded-full" style={{ background: tierColor[t as keyof typeof tierColor] }} aria-hidden />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* selection readout — text alternative, not colour alone */}
          {sel && (
            <div className="mt-2.5 card flex items-center gap-3.5 p-4" aria-live="polite">
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-lg font-display text-sm font-bold text-white tnum"
                style={{ background: tierColor[tierFor(sel.violationRate)] }}
              >
                {sel.n}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-md font-semibold text-ink-900">{sel.city}</p>
                <p className="truncate text-sm text-ink-500">
                  {sel.state} · {sel.violationRate}% of {sel.totalScans} scans · {tierFor(sel.violationRate)} priority
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------- ranked list */}
        <section className="gutter pt-7">
          <div className="mb-3 flex items-center gap-2">
            <Layers size={16} className="text-ink-400" aria-hidden />
            <h2 className="font-display text-md font-semibold">{t('officer.allLocations')}</h2>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-ink-50 text-2xs uppercase tracking-[0.06em] text-ink-500">
                  <th scope="col" className="px-4 py-2.5 font-semibold">{t('officer.city')}</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">{t('home.violations')}</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">{t('officer.priority')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {spots.map((s) => (
                  <tr
                    key={s.district}
                    onClick={() => setSel(s)}
                    className={`cursor-pointer transition-colors hover:bg-ink-50 ${sel?.district === s.district ? 'bg-brand-50' : ''}`}
                  >
                    <th scope="row" className="px-4 py-2.5 font-medium text-ink-900">
                      {s.city}
                      <span className="ml-1.5 font-normal text-ink-500">{s.state}</span>
                    </th>
                    <td className="px-4 py-2.5 text-right font-semibold text-ink-800 tnum">{s.n}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={tierFor(s.violationRate) === 'high' ? 'badge-bad' : tierFor(s.violationRate) === 'medium' ? 'badge-warn' : 'badge-ok'}>
                        {tierFor(s.violationRate)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && spots.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-ink-500">
                {t('officer.noHotspots')}
              </p>
            )}
          </div>
        </section>

        <div className="gutter pt-5">
          <div className="flex gap-3 rounded-xl border border-ink-200 bg-ink-50 p-4">
            <Info size={17} className="mt-0.5 shrink-0 text-ink-400" aria-hidden />
            <p className="text-xs leading-relaxed text-ink-500">
              Positions are schematic and indicate reporting clusters, not surveyed boundaries. Counts
              aggregate officer-confirmed cases only.
            </p>
          </div>
        </div>
      </ScrollArea>

      <BottomNav />
    </Screen>
  )
}
