import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Menu, TrendingUp } from 'lucide-react'
import { Screen, ScrollArea } from '../components/UI'
import BottomNav from '../components/BottomNav'
import { Wordmark } from '../components/Brand'

export default function OfficerDashboard() {
  const { t } = useTranslation()
  const nav = useNavigate()

  const stats = {
    total: '8,432',
    compliant: '7,621',
    violations: '811',
    rate: '96.2%',
  }

  const recentInspections = [
    { id: '1', product: 'Fortune Oil', place: 'Delhi', verdict: 'VIOLATION' },
    { id: '2', product: 'Amul Milk', place: 'Noida', verdict: 'PASS' },
    { id: '3', product: 'Britannia Biscuits', place: 'Gurgaon', verdict: 'PASS' },
    { id: '4', product: 'Nestle Maggi', place: 'Delhi', verdict: 'VIOLATION' },
  ]

  return (
    <Screen>
      {/* ---------------------------------------------------- Top Bar */}
      <header className="sticky top-0 z-30 flex min-h-[64px] items-center justify-between border-b border-ink-200/60 bg-surface/90 px-5 backdrop-blur-md">
        <Wordmark size={26} />
        <button
          type="button"
          aria-label={t('officer.more')}
          onClick={() => nav('/app/profile')}
          className="grid h-11 w-11 place-items-center rounded-full text-ink-600 hover:bg-ink-100"
        >
          <Menu size={22} strokeWidth={2} aria-hidden />
        </button>
      </header>

      <ScrollArea className="pb-8">
        {/* Officer Overview Title */}
        <section className="gutter pt-4">
          <h1 className="font-display text-xl font-bold text-ink-900">
            {t('officer.dashboard')}
          </h1>
          <p className="mt-0.5 text-xs text-ink-500">
            {t('officer.lastUpdated')}
          </p>
        </section>

        {/* -------------------------------------------- 4 Key Metric Cards */}
        <section className="gutter pt-4">
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {/* Total */}
            <div className="card flex flex-col justify-between p-2 text-center">
              <span className="text-2xs font-bold text-ink-500 uppercase tracking-tight">{t('officer.filterAll')}</span>
              <span className="font-display text-sm sm:text-base font-bold text-ink-900 tnum">{stats.total}</span>
            </div>

            {/* Compliant */}
            <div className="card flex flex-col justify-between p-2 text-center">
              <span className="text-2xs font-bold text-ok-base uppercase tracking-tight">{t('home.compliant')}</span>
              <span className="font-display text-sm sm:text-base font-bold text-ok-base tnum">{stats.compliant}</span>
            </div>

            {/* Violations */}
            <div className="card flex flex-col justify-between p-2 text-center">
              <span className="text-2xs font-bold text-bad-base uppercase tracking-tight">{t('home.violations')}</span>
              <span className="font-display text-sm sm:text-base font-bold text-bad-base tnum">{stats.violations}</span>
            </div>

            {/* Rate */}
            <div className="card flex flex-col justify-between p-2 text-center">
              <span className="text-2xs font-bold text-ok-base uppercase tracking-tight">{t('officer.rate')}</span>
              <span className="font-display text-sm sm:text-base font-bold text-ok-base tnum">{stats.rate}</span>
            </div>
          </div>
        </section>

        {/* --------------------------------------- Compliance Trend Area Chart */}
        <section className="gutter pt-5">
          <div className="rounded-2xl border border-ink-200/80 bg-surface p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-ink-900">
                {t('officer.complianceTrend')}
              </h2>
              <span className="flex items-center gap-1 rounded-md bg-ok-soft px-2 py-0.5 text-2xs font-bold text-ok-text">
                <TrendingUp size={12} strokeWidth={2.4} aria-hidden />
                +2.4%
              </span>
            </div>

            {/* SVG Trend Chart */}
            <div className="mt-4 relative h-32 w-full">
              <svg viewBox="0 0 300 100" className="h-full w-full overflow-visible" role="img" aria-label={t('officer.complianceAria')}>
                <defs>
                  <linearGradient id="trend-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="var(--cmp-ok)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--cmp-ok)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                <line x1="30" y1="20" x2="290" y2="20" stroke="var(--cmp-ink)" strokeOpacity="0.06" />
                <line x1="30" y1="50" x2="290" y2="50" stroke="var(--cmp-ink)" strokeOpacity="0.06" />
                <line x1="30" y1="80" x2="290" y2="80" stroke="var(--cmp-ink)" strokeOpacity="0.06" />

                {/* Axis labels */}
                <text x="5" y="23" fill="var(--cmp-ink-muted)" fontSize="8" fontFamily="sans-serif">20%</text>
                <text x="5" y="53" fill="var(--cmp-ink-muted)" fontSize="8" fontFamily="sans-serif">10%</text>
                <text x="5" y="83" fill="var(--cmp-ink-muted)" fontSize="8" fontFamily="sans-serif">00%</text>

                {/* Area fill under curve */}
                <path
                  d="M 30 75 Q 70 82 110 65 T 190 48 T 250 42 T 290 35 L 290 90 L 30 90 Z"
                  fill="url(#trend-grad)"
                />

                {/* Main trend line */}
                <path
                  d="M 30 75 Q 70 82 110 65 T 190 48 T 250 42 T 290 35"
                  fill="none"
                  stroke="var(--cmp-ok)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Data Points */}
                {[
                  { x: 30, y: 75, m: 'Jan' },
                  { x: 73, y: 80, m: 'Feb' },
                  { x: 116, y: 65, m: 'Mar' },
                  { x: 160, y: 55, m: 'Apr' },
                  { x: 203, y: 46, m: 'May' },
                  { x: 246, y: 42, m: 'Jun' },
                  { x: 290, y: 35, m: 'Jul' },
                ].map((pt) => (
                  <g key={pt.m}>
                    <circle cx={pt.x} cy={pt.y} r="3" fill="#fff" stroke="var(--cmp-ok)" strokeWidth="2" />
                    <text x={pt.x - 6} y="98" fill="var(--cmp-ink-muted)" fontSize="8" fontFamily="sans-serif">{pt.m}</text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </section>

        {/* -------------------------------------------- Recent Inspections */}
        <section className="gutter pt-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-sm font-bold text-ink-900">{t('officer.recentInspectionsTitle')}</h2>
            <button
              type="button"
              onClick={() => nav('/app/inspections')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              {t('home.viewAll')}
            </button>
          </div>

          <div className="space-y-2.5">
            {recentInspections.map((item) => {
              const isBad = item.verdict === 'VIOLATION'
              return (
                <div
                  key={item.id}
                  onClick={() => nav('/app/inspections')}
                  className="card-interactive flex items-center justify-between p-3 cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-ink-900">{item.product}</h3>
                    <p className="text-2xs text-ink-500">{item.place}</p>
                  </div>
                  <span className={isBad ? 'badge-bad' : 'badge-ok'}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isBad ? 'bg-bad-base' : 'bg-ok-base'}`} />
                    {isBad ? t('officer.violation') : t('officer.clear')}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      </ScrollArea>

      <BottomNav />
    </Screen>
  )
}
