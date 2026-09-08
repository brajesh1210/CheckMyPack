import { useState } from 'react'
import { Layers, Info } from 'lucide-react'
import { Screen, ScrollArea, AppBar } from '../components/UI'
import BottomNav from '../components/BottomNav'

type Spot = { city: string; state: string; n: number; x: number; y: number }

const spots: Spot[] = [
  { city: 'Mumbai', state: 'Maharashtra', n: 132, x: 27, y: 63 },
  { city: 'Delhi', state: 'NCT', n: 84, x: 37, y: 30 },
  { city: 'Rajkot', state: 'Gujarat', n: 74, x: 20, y: 51 },
  { city: 'Kolkata', state: 'West Bengal', n: 61, x: 70, y: 51 },
  { city: 'Chennai', state: 'Tamil Nadu', n: 47, x: 45, y: 84 },
  { city: 'Bengaluru', state: 'Karnataka', n: 39, x: 37, y: 79 },
  { city: 'Lucknow', state: 'Uttar Pradesh', n: 33, x: 47, y: 37 },
  { city: 'Guwahati', state: 'Assam', n: 18, x: 82, y: 40 },
]

const tier = (n: number) => (n >= 80 ? 'high' : n >= 40 ? 'medium' : 'low')
const tierColor = { high: '#C62828', medium: '#B26B00', low: '#2E7D32' } as const

export default function Heatmap() {
  const [sel, setSel] = useState<Spot | null>(spots[0])

  return (
    <Screen>
      <AppBar title="Enforcement map" subtitle="Violations reported this quarter" />

      <ScrollArea className="pb-6">
        {/* ------------------------------------------------------------- map */}
        <div className="gutter pt-4">
          <div className="relative overflow-hidden rounded-xl border border-ink-200 bg-info-soft/40">
            <svg viewBox="0 0 100 105" className="block w-full" role="img" aria-label="Map of India with violation hotspots">
              {/* stylised landmass — schematic, not a survey map */}
              <path
                d="M34 12 L44 8 L54 13 L62 11 L70 17 L78 16 L84 24 L88 34 L83 41 L86 47 L79 52 L74 49 L72 56 L66 62 L60 74 L54 86 L48 96 L42 88 L38 78 L33 70 L27 64 L21 56 L17 47 L14 38 L18 30 L24 24 L28 16 Z"
                fill="#DCE7F2"
                stroke="#B9CEE3"
                strokeWidth="0.8"
                strokeLinejoin="round"
              />
              {/* heat halos */}
              {spots.map((s) => {
                const t = tier(s.n)
                return (
                  <circle
                    key={`halo-${s.city}`}
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
                const t = tier(s.n)
                const active = sel?.city === s.city
                return (
                  <g key={s.city} onClick={() => setSel(s)} style={{ cursor: 'pointer' }}>
                    <circle cx={s.x} cy={s.y} r={active ? 3.2 : 2.3} fill={tierColor[t]} stroke="#fff" strokeWidth={active ? 1.2 : 0.9} />
                    {/* generous invisible hit area */}
                    <circle cx={s.x} cy={s.y} r="7" fill="transparent" />
                  </g>
                )
              })}
            </svg>

            {/* legend */}
            <div className="absolute bottom-2.5 left-2.5 rounded-lg bg-surface/95 px-2.5 py-2 shadow-sm backdrop-blur">
              <p className="mb-1.5 text-2xs font-semibold uppercase tracking-[0.06em] text-ink-500">Violations</p>
              <ul className="space-y-1">
                {[
                  ['high', '80+'],
                  ['medium', '40–79'],
                  ['low', 'under 40'],
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
                style={{ background: tierColor[tier(sel.n)] }}
              >
                {sel.n}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-md font-semibold text-ink-900">{sel.city}</p>
                <p className="truncate text-sm text-ink-500">{sel.state} · {tier(sel.n)} priority</p>
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------- ranked list */}
        <section className="gutter pt-7">
          <div className="mb-3 flex items-center gap-2">
            <Layers size={16} className="text-ink-400" aria-hidden />
            <h2 className="font-display text-md font-semibold">All locations</h2>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-ink-50 text-2xs uppercase tracking-[0.06em] text-ink-500">
                  <th scope="col" className="px-4 py-2.5 font-semibold">City</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">Violations</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {spots.map((s) => (
                  <tr
                    key={s.city}
                    onClick={() => setSel(s)}
                    className={`cursor-pointer transition-colors hover:bg-ink-50 ${sel?.city === s.city ? 'bg-brand-50' : ''}`}
                  >
                    <th scope="row" className="px-4 py-2.5 font-medium text-ink-900">
                      {s.city}
                      <span className="ml-1.5 font-normal text-ink-400">{s.state}</span>
                    </th>
                    <td className="px-4 py-2.5 text-right font-semibold text-ink-800 tnum">{s.n}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={tier(s.n) === 'high' ? 'badge-bad' : tier(s.n) === 'medium' ? 'badge-warn' : 'badge-ok'}>
                        {tier(s.n)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
