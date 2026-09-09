import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Screen, ScrollArea } from '../components/UI'
import BottomNav from '../components/BottomNav'
import { IndiaMap, STATES_LIST, type MapCluster, ALL_CLUSTERS } from '../components/IndiaMap'
import { Wordmark } from '../components/Brand'

export default function Heatmap() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [tab, setTab] = useState<'india' | 'states'>('india')
  const [selectedState, setSelectedState] = useState('All States')
  const [selectedCity, setSelectedCity] = useState<MapCluster | null>(null)

  const hotspots = ALL_CLUSTERS.slice(0, 3)

  return (
    <Screen>
      {/* ---------------------------------------------------- Header Bar */}
      <header className="sticky top-0 z-30 flex min-h-[64px] items-center justify-between border-b border-ink-200/60 bg-surface/90 px-5 backdrop-blur-md">
        <Wordmark size={26} />
        {/* Segmented Filter Pills */}
        <div className="flex items-center rounded-full bg-ink-100 p-1">
          <button
            type="button"
            onClick={() => {
              setTab('india')
              setSelectedState('All States')
            }}
            className={`min-h-[44px] rounded-full px-3 text-xs font-semibold transition-all ${
              tab === 'india' ? 'bg-surface text-ink-900 shadow-xs' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            {t('officer.tabIndia')}
          </button>
          <button
            type="button"
            onClick={() => setTab('states')}
            className={`min-h-[44px] rounded-full px-3 text-xs font-semibold transition-all ${
              tab === 'states' ? 'bg-surface text-ink-900 shadow-xs' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            {t('officer.tabStates')}
          </button>
        </div>
      </header>

      <ScrollArea className="pb-8">
        {/* Page Title */}
        <section className="gutter pt-4">
          <div className="flex items-baseline justify-between">
            <div>
              <h1 className="font-display text-xl font-bold text-ink-900">
                {t('officer.hotspots')}
              </h1>
              <p className="mt-0.5 text-xs text-ink-500">
                {t('officer.lastUpdated')}
              </p>
            </div>
            <span className="rounded-full bg-brand-50 border border-brand-200 px-2.5 py-1 text-2xs font-bold text-brand-700">
              {t('officer.circleAll')}
            </span>
          </div>
        </section>

        {/* State Filter Chips when in States Mode */}
        {tab === 'states' && (
          <section className="gutter pt-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {STATES_LIST.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedState(st)}
                  className={`min-h-[44px] shrink-0 rounded-full px-3 text-xs font-semibold transition-all ${
                    selectedState === st
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-surface text-ink-700 border border-ink-200/80 hover:bg-ink-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ------------------------------------------- Geographic Heatmap Map */}
        <section className="gutter pt-3">
          <IndiaMap
            mode={tab}
            selectedState={selectedState}
            onSelectCluster={(c) => setSelectedCity(c)}
          />
        </section>

        {/* ------------------------------------------- Legend Bar */}
        <section className="gutter pt-3">
          <div className="flex items-center justify-between rounded-xl bg-surface px-4 py-2.5 text-2xs font-semibold border border-ink-200/70 shadow-xs">
            <span className="text-ink-500 uppercase tracking-wider">{t('officer.violationRate')}:</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-bad-base">
                <span className="h-2 w-2 rounded-full bg-bad-base" />
                {t('officer.high')} (&gt;60%)
              </span>
              <span className="flex items-center gap-1.5 text-warn-base">
                <span className="h-2 w-2 rounded-full bg-warn-base" />
                {t('officer.medium')} (30-60%)
              </span>
              <span className="flex items-center gap-1.5 text-ok-base">
                <span className="h-2 w-2 rounded-full bg-ok-base" />
                {t('officer.low')} (&lt;30%)
              </span>
            </div>
          </div>
        </section>

        {/* ----------------------------------------- Hotspot Summary Card */}
        <section className="gutter pt-4">
          <div className="rounded-2xl border border-ink-200/80 bg-surface p-4 shadow-xs">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-sm font-bold text-ink-900">
                {t('officer.hotspotSummary')}
              </h2>
              <button
                type="button"
                onClick={() => nav('/app/reports')}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                {t('home.viewAll')}
              </button>
            </div>

            <div className="space-y-2.5">
              {hotspots.map((h) => (
                <div
                  key={h.name}
                  onClick={() => setSelectedCity(h)}
                  className="flex items-center justify-between py-1.5 text-xs cursor-pointer hover:bg-ink-50 rounded-lg px-2 -mx-2 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        h.tier === 'high' ? 'bg-bad-base' : 'bg-warn-base'
                      }`}
                    />
                    <div>
                      <span className="font-semibold text-ink-800">{h.name}</span>
                      <span className="ml-1.5 text-2xs text-ink-400">({h.state})</span>
                    </div>
                  </div>
                  <span className="font-display font-medium text-ink-600 tnum">
                    {t('officer.violationsCount', { count: h.violations })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollArea>

      <BottomNav />
    </Screen>
  )
}
