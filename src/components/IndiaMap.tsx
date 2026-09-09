import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, MapPin } from 'lucide-react'

export interface MapCluster {
  id: string
  name: string
  state: string
  violations: number
  totalScans: number
  expiredCount: number
  tier: 'high' | 'medium' | 'low'
  x: number
  y: number
  topRules?: string[]
}

export const ALL_CLUSTERS: MapCluster[] = [
  {
    id: 'del',
    name: 'Delhi NCR (Dwarka)',
    state: 'Delhi NCR',
    violations: 84,
    totalScans: 142,
    expiredCount: 9,
    tier: 'medium',
    x: 35.5,
    y: 28.5,
    topRules: ['Unit Sale Price Missing', 'FSSAI Licence', 'Net Qty Font Size'],
  },
  {
    id: 'mum',
    name: 'Mumbai',
    state: 'Maharashtra',
    violations: 132,
    totalScans: 198,
    expiredCount: 14,
    tier: 'high',
    x: 21.5,
    y: 60.5,
    topRules: ['MRP (LMPC R.6)', 'Best Before Expired', 'Customer Care Info'],
  },
  {
    id: 'raj',
    name: 'Rajkot',
    state: 'Gujarat',
    violations: 74,
    totalScans: 110,
    expiredCount: 8,
    tier: 'medium',
    x: 12.5,
    y: 52.0,
    topRules: ['MRP Overprinting', 'Veg/Non-Veg Symbol', 'Mfg Address Incomplete'],
  },
  {
    id: 'ahm',
    name: 'Ahmedabad',
    state: 'Gujarat',
    violations: 65,
    totalScans: 105,
    expiredCount: 6,
    tier: 'medium',
    x: 18.5,
    y: 49.0,
    topRules: ['MRP Declarations', 'FSSAI Logo Clarity'],
  },
  {
    id: 'pune',
    name: 'Pune',
    state: 'Maharashtra',
    violations: 58,
    totalScans: 95,
    expiredCount: 5,
    tier: 'medium',
    x: 25.0,
    y: 64.5,
    topRules: ['Consumer Care Email', 'Batch Number Legibility'],
  },
  {
    id: 'blr',
    name: 'Bengaluru',
    state: 'Karnataka',
    violations: 42,
    totalScans: 120,
    expiredCount: 3,
    tier: 'low',
    x: 33.5,
    y: 82.5,
    topRules: ['Importer Address', 'Nutritional Table Missing'],
  },
  {
    id: 'chn',
    name: 'Chennai',
    state: 'Tamil Nadu',
    violations: 36,
    totalScans: 98,
    expiredCount: 2,
    tier: 'low',
    x: 43.5,
    y: 81.5,
    topRules: ['Unit Sale Price', 'Customer Care Helpline'],
  },
  {
    id: 'kol',
    name: 'Kolkata',
    state: 'West Bengal',
    violations: 29,
    totalScans: 88,
    expiredCount: 4,
    tier: 'low',
    x: 70.0,
    y: 48.0,
    topRules: ['Best Before Date', 'FSSAI Licence Number'],
  },
  {
    id: 'hyd',
    name: 'Hyderabad',
    state: 'Telangana',
    violations: 24,
    totalScans: 76,
    expiredCount: 2,
    tier: 'low',
    x: 37.5,
    y: 66.5,
    topRules: ['MRP Inclusive of Taxes', 'Net Weight Declarations'],
  },
  {
    id: 'lko',
    name: 'Lucknow',
    state: 'Uttar Pradesh',
    violations: 48,
    totalScans: 82,
    expiredCount: 7,
    tier: 'medium',
    x: 45.0,
    y: 35.0,
    topRules: ['MRP Clarity', 'Date of Packaging', 'Consumer Care'],
  },
  {
    id: 'jpr',
    name: 'Jaipur',
    state: 'Rajasthan',
    violations: 39,
    totalScans: 74,
    expiredCount: 4,
    tier: 'low',
    x: 27.5,
    y: 35.0,
    topRules: ['LMPC Declarations', 'Generic Name of Commodity'],
  },
  {
    id: 'pat',
    name: 'Patna',
    state: 'Bihar',
    violations: 52,
    totalScans: 79,
    expiredCount: 6,
    tier: 'medium',
    x: 58.5,
    y: 38.0,
    topRules: ['MRP Present', 'Best Before Expired'],
  },
  {
    id: 'ghy',
    name: 'Guwahati',
    state: 'Assam',
    violations: 19,
    totalScans: 55,
    expiredCount: 1,
    tier: 'low',
    x: 82.5,
    y: 37.0,
    topRules: ['Net Qty Declaration', 'Manufacturer Name'],
  },
  {
    id: 'koc',
    name: 'Kochi',
    state: 'Kerala',
    violations: 18,
    totalScans: 62,
    expiredCount: 1,
    tier: 'low',
    x: 31.0,
    y: 93.0,
    topRules: ['Unit Sale Price', 'LMPC R.6'],
  },
]

export const STATES_LIST = [
  'All States',
  'Maharashtra',
  'Delhi NCR',
  'Gujarat',
  'Karnataka',
  'Tamil Nadu',
  'Uttar Pradesh',
  'West Bengal',
  'Rajasthan',
  'Telangana',
  'Bihar',
  'Kerala',
  'Assam',
]

export function IndiaMap({
  mode = 'india',
  selectedState = 'All States',
  onSelectCluster,
}: {
  mode?: 'india' | 'states'
  selectedState?: string
  onSelectCluster?: (cluster: MapCluster) => void
}) {
  const nav = useNavigate()
  const [selected, setSelected] = useState<MapCluster | null>(ALL_CLUSTERS[0])
  const [activeFilter, setActiveFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  const handlePick = (c: MapCluster) => {
    setSelected(c)
    onSelectCluster?.(c)
  }

  // Filter clusters by state and tier
  const visibleClusters = ALL_CLUSTERS.filter((c) => {
    if (selectedState && selectedState !== 'All States' && c.state !== selectedState) {
      return false
    }
    if (activeFilter === 'high') return c.tier === 'high'
    if (activeFilter === 'medium') return c.tier === 'medium'
    if (activeFilter === 'low') return c.tier === 'low'
    return true
  })

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-ink-200/80 bg-gradient-to-b from-blue-50/60 via-amber-50/30 to-emerald-50/40 p-4 shadow-sm">
      {/* Quick Tier Filters Bar */}
      <div className="mb-3 flex items-center justify-between gap-1 overflow-x-auto pb-1 text-2xs font-semibold scrollbar-none">
        <span className="text-ink-500 shrink-0 font-display">Hotspots:</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`min-h-[44px] rounded-full px-3 transition-all ${
              activeFilter === 'all'
                ? 'bg-ink-900 text-white shadow-xs'
                : 'bg-white/80 text-ink-600 hover:bg-white border border-ink-200/60'
            }`}
          >
            All ({ALL_CLUSTERS.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('high')}
            className={`min-h-[44px] rounded-full px-3 transition-all flex items-center gap-1 ${
              activeFilter === 'high'
                ? 'bg-bad-base text-white shadow-xs'
                : 'bg-white/80 text-bad-base hover:bg-white border border-bad-base/30'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-bad-base" />
            High
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('medium')}
            className={`min-h-[44px] rounded-full px-3 transition-all flex items-center gap-1 ${
              activeFilter === 'medium'
                ? 'bg-warn-base text-white shadow-xs'
                : 'bg-white/80 text-warn-base hover:bg-white border border-warn-base/30'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-warn-base" />
            Medium
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('low')}
            className={`min-h-[44px] rounded-full px-3 transition-all flex items-center gap-1 ${
              activeFilter === 'low'
                ? 'bg-ok-base text-white shadow-xs'
                : 'bg-white/80 text-ok-base hover:bg-white border border-ok-base/30'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-ok-base" />
            Low
          </button>
        </div>
      </div>

      {/* ------------------------------------------------ Map SVG Canvas */}
      <div className="relative mx-auto w-full max-w-[380px]">
        <svg
          viewBox="0 0 100 112"
          className="block h-auto w-full select-none drop-shadow-sm"
          role="img"
          aria-label="Official Map of India with Legal Metrology violation clusters"
        >
          <defs>
            {/* Gradients for Halos */}
            <radialGradient id="in-heat-high" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--cmp-bad)" stopOpacity="0.85" />
              <stop offset="45%" stopColor="var(--cmp-warn)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="var(--cmp-warn)" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="in-heat-med" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--cmp-warn)" stopOpacity="0.8" />
              <stop offset="55%" stopColor="var(--cmp-warn)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--cmp-warn)" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="in-heat-low" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--cmp-ok)" stopOpacity="0.75" />
              <stop offset="60%" stopColor="var(--cmp-ok)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--cmp-ok)" stopOpacity="0" />
            </radialGradient>

            <filter id="in-map-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="var(--cmp-ink)" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* ==================================== Official India Geographic Landmass */}
          <g filter="url(#in-map-shadow)">
            {/* Mainland India Authentic Boundary Path */}
            <path
              d="M 33 4
                 C 35 2, 40 2, 43 5
                 C 45 8, 46 12, 49 14
                 C 51 16, 54 18, 56 20
                 C 58 22, 63 25, 67 27
                 C 68 25, 70 25, 71 27
                 C 73 28, 77 28, 80 26
                 C 83 23, 89 23, 93 25
                 C 96 27, 97 31, 95 34
                 C 93 36, 91 39, 90 43
                 C 89 46, 88 50, 85 54
                 C 83 55, 81 54, 80 50
                 C 80 46, 78 44, 75 43
                 C 73 42, 73 37, 70 36
                 C 69 41, 71 46, 71 49
                 C 69 53, 66 56, 62 62
                 C 58 68, 53 74, 48 80
                 C 44 85, 42 91, 39 97
                 C 37 101, 35 101, 33 97
                 C 30 92, 28 85, 27 77
                 C 26 70, 24 64, 22 59
                 C 20 57, 17 58, 14 58
                 C 9 57, 7 53, 8 49
                 C 10 47, 13 46, 12 44
                 C 8 43, 6 41, 8 38
                 C 11 36, 14 34, 16 30
                 C 18 25, 21 21, 23 17
                 C 26 12, 29 8, 33 4 Z"
              fill="var(--cmp-map-fill)"
              stroke="var(--cmp-map-line)"
              strokeWidth="0.9"
              strokeLinejoin="round"
              className="transition-colors duration-300"
            />

            {/* Andaman and Nicobar Islands (East / Bay of Bengal) */}
            <g fill="var(--cmp-map-fill)" stroke="var(--cmp-map-line)" strokeWidth="0.6">
              <ellipse cx="91" cy="80" rx="1.2" ry="2.2" />
              <ellipse cx="92" cy="85" rx="1.1" ry="2" />
              <ellipse cx="93" cy="91" rx="1.3" ry="2.4" />
              <ellipse cx="94.5" cy="96" rx="1.2" ry="1.8" />
            </g>

            {/* Lakshadweep Islands (West / Arabian Sea) */}
            <g fill="var(--cmp-map-fill)" stroke="var(--cmp-map-line)" strokeWidth="0.6">
              <circle cx="18" cy="85" r="1.1" />
              <circle cx="19" cy="89" r="1.2" />
              <circle cx="20.5" cy="93" r="1" />
            </g>

            {/* Internal State Boundaries & Natural River / Region Lines */}
            <path
              d="M 23 17 Q 35 19 49 14
                 M 21 21 Q 33 25 45 23
                 M 16 30 Q 28 32 45 28
                 M 16 34 Q 30 38 48 34
                 M 8 38 Q 22 43 45 39
                 M 12 44 Q 28 47 52 42
                 M 14 58 Q 28 54 48 48
                 M 22 59 Q 34 58 56 52
                 M 24 64 Q 40 62 62 62
                 M 27 77 Q 38 72 53 74
                 M 28 85 Q 36 82 44 85
                 M 70 36 L 75 43
                 M 48 34 L 58 38 L 71 49
                 M 45 39 L 55 46 L 66 56"
              fill="none"
              stroke="var(--cmp-map-grid)"
              strokeWidth="0.5"
              strokeDasharray="1.2 1.2"
              strokeOpacity="0.75"
            />
          </g>

          {/* Geographic Region Text Watermarks */}
          <text x="35" y="16" fontSize="2.8" fill="var(--cmp-ink-muted)" fontWeight="600" textAnchor="middle" opacity="0.6">NORTH</text>
          <text x="17" y="42" fontSize="2.8" fill="var(--cmp-ink-muted)" fontWeight="600" textAnchor="middle" opacity="0.6">WEST</text>
          <text x="36" y="52" fontSize="2.8" fill="var(--cmp-ink-muted)" fontWeight="600" textAnchor="middle" opacity="0.6">CENTRAL</text>
          <text x="68" y="42" fontSize="2.8" fill="var(--cmp-ink-muted)" fontWeight="600" textAnchor="middle" opacity="0.6">EAST</text>
          <text x="86" y="32" fontSize="2.8" fill="var(--cmp-ink-muted)" fontWeight="600" textAnchor="middle" opacity="0.6">N-EAST</text>
          <text x="36" y="80" fontSize="2.8" fill="var(--cmp-ink-muted)" fontWeight="600" textAnchor="middle" opacity="0.6">SOUTH</text>

          {/* ================================================= Heatmap Radiance Halos */}
          {visibleClusters.map((c) => {
            const grad = c.tier === 'high' ? 'url(#in-heat-high)' : c.tier === 'medium' ? 'url(#in-heat-med)' : 'url(#in-heat-low)'
            const radius = c.tier === 'high' ? 14 : c.tier === 'medium' ? 11 : 8.5
            return (
              <g key={`halo-${c.id}`} pointerEvents="none">
                <circle cx={c.x} cy={c.y} r={radius} fill={grad} />
                <circle cx={c.x} cy={c.y} r={radius * 0.55} fill={grad} />
              </g>
            )
          })}

          {/* ================================================= Clickable City Markers */}
          {visibleClusters.map((c) => {
            const isSel = selected?.id === c.id
            const color = c.tier === 'high' ? 'var(--cmp-bad)' : c.tier === 'medium' ? 'var(--cmp-warn)' : 'var(--cmp-ok)'
            return (
              <g
                key={`marker-${c.id}`}
                onClick={() => handlePick(c)}
                className="cursor-pointer transition-transform duration-200 hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                tabIndex={0}
                role="button"
                aria-label={`${c.name}, ${c.state}: ${c.violations} violations`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handlePick(c)
                  }
                }}
              >
                {/* Active Ripple Animation Ring */}
                {isSel && (
                  <>
                    <circle cx={c.x} cy={c.y} r={6} fill="none" stroke={color} strokeWidth="1" opacity="0.9">
                      <animate attributeName="r" values="3.5;7.5;3.5" dur="1.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.9;0.1;0.9" dur="1.8s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={c.x} cy={c.y} r={4.2} fill={color} opacity="0.25" />
                  </>
                )}

                {/* Outer Pin Border & Center */}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isSel ? 3.4 : 2.4}
                  fill={color}
                  stroke="var(--cmp-surface, #fff)"
                  strokeWidth={isSel ? 1.2 : 0.9}
                  className="transition-all"
                />

                {/* City Name Label on Map */}
                <text
                  x={c.x}
                  y={c.y - (isSel ? 4.8 : 3.8)}
                  fontSize={isSel ? '3.2' : '2.6'}
                  fontWeight={isSel ? '800' : '600'}
                  fill="var(--cmp-ink)"
                  textAnchor="middle"
                  paintOrder="stroke"
                  stroke="var(--cmp-surface, #fff)"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="pointer-events-none select-none"
                >
                  {c.name.split(' ')[0]}
                </text>

                {/* Generous Invisible Tap Target for mobile touches */}
                <circle cx={c.x} cy={c.y} r={9} fill="transparent" />
              </g>
            )
          })}
        </svg>
      </div>

      {/* -------------------------------------- Selected Hotspot Detailed Card */}
      {selected && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-ink-200/90 bg-surface p-3.5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`grid h-8 w-8 place-items-center rounded-xl text-white ${
                  selected.tier === 'high'
                    ? 'bg-bad-base'
                    : selected.tier === 'medium'
                      ? 'bg-warn-base'
                      : 'bg-ok-base'
                }`}
              >
                <MapPin size={16} strokeWidth={2.4} aria-hidden />
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-sm font-bold text-ink-900">{selected.name}</h3>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wider ${
                      selected.tier === 'high'
                        ? 'bg-bad-soft text-bad-text border border-bad-base/20'
                        : selected.tier === 'medium'
                          ? 'bg-warn-soft text-warn-text border border-warn-base/20'
                          : 'bg-ok-soft text-ok-text border border-ok-base/20'
                    }`}
                  >
                    {selected.tier}
                  </span>
                </div>
                <p className="text-2xs text-ink-500">{selected.state}</p>
              </div>
            </div>

            <div className="text-right">
              <div className="font-display text-base font-bold text-ink-900 tnum">
                {selected.violations}
              </div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-bad-base">
                Violations
              </p>
            </div>
          </div>

          {/* Quick Metrics Breakdown */}
          <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-ink-50/80 p-2.5 text-center text-2xs">
            <div>
              <span className="text-ink-400 font-medium">Total Scans</span>
              <p className="font-display font-bold text-ink-900 tnum">{selected.totalScans}</p>
            </div>
            <div>
              <span className="text-ink-400 font-medium">Violation Rate</span>
              <p className="font-display font-bold text-bad-base tnum">
                {Math.round((selected.violations / selected.totalScans) * 100)}%
              </p>
            </div>
            <div>
              <span className="text-ink-400 font-medium">Expired Goods</span>
              <p className="font-display font-bold text-warn-base tnum">{selected.expiredCount}</p>
            </div>
          </div>

          {/* Top Flagged Rules */}
          {selected.topRules && selected.topRules.length > 0 && (
            <div className="mt-2.5">
              <p className="text-2xs font-semibold text-ink-700">Top Detected Issues:</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {selected.topRules.map((rule) => (
                  <span
                    key={rule}
                    className="rounded-lg bg-ink-100/90 px-2 py-0.5 text-2xs font-medium text-ink-800"
                  >
                    • {rule}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action to Inspect Full District Reports */}
          <button
            type="button"
            onClick={() => nav(`/app/reports?district=${encodeURIComponent(selected.name)}`)}
            className="btn-secondary btn-block mt-3 min-h-[44px] rounded-xl text-xs font-semibold"
          >
            <span>View {selected.name} Inspection Records</span>
            <ArrowRight size={14} strokeWidth={2} aria-hidden />
          </button>
        </div>
      )}
    </div>
  )
}