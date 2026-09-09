import { useEffect, useState } from 'react'
import { Repeat, MapPinned, Download, AlertCircle } from 'lucide-react'
import { Screen, ScrollArea, AppBar, SectionHeader } from '../components/UI'
import BottomNav from '../components/BottomNav'
import {
  fetchHotspots,
  fetchOffenders,
  hotspotsCsv,
  offendersCsv,
  downloadCsv,
  summarise,
  type Hotspot,
  type Offender,
} from '../lib/officer'

export default function OfficerReports() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [offenders, setOffenders] = useState<Offender[]>([])
  const [live, setLive] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void Promise.all([fetchHotspots(), fetchOffenders()]).then(([h, o]) => {
      if (cancelled) return
      setHotspots(h.data)
      setOffenders(o.data)
      setLive(h.live && o.live)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const summary = summarise(hotspots, offenders)
  const stamp = new Date().toISOString().slice(0, 10)

  return (
    <Screen>
      <AppBar
        title="Reports"
        subtitle={
          loading
            ? 'Loading enforcement data'
            : live
              ? 'Across all reporting users'
              : 'From scans on this device'
        }
      />

      <ScrollArea className="gutter pb-6">
        {/* ------------------------------------------------------- headline */}
        <div className="pt-4">
          <div className="card grid grid-cols-3 divide-x divide-ink-200">
            {[
              ['Inspections', summary.totalScans],
              ['Violations', summary.violations],
              ['Districts', summary.districtsCovered],
            ].map(([label, value]) => (
              <div key={label} className="px-3 py-4 text-center">
                <p className="font-display text-2xl font-semibold text-ink-900 tnum">{value}</p>
                <p className="mt-0.5 text-2xs uppercase tracking-[0.06em] text-ink-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* --------------------------------------------- repeat offenders */}
        <div className="pt-7">
          <SectionHeader
            title="Repeat-offender registry"
            action={offenders.length > 0 ? 'Export CSV' : undefined}
            onAction={() => void downloadCsv(`repeat-offenders-${stamp}.csv`, offendersCsv(offenders))}
          />

          {loading ? (
            <div className="card p-4">
              <p className="text-sm text-ink-500">Loading…</p>
            </div>
          ) : offenders.length === 0 ? (
            <div className="card flex items-start gap-3 p-4">
              <AlertCircle size={17} className="mt-0.5 shrink-0 text-ink-400" aria-hidden />
              <p className="text-sm leading-relaxed text-ink-600">
                No brand has been reported twice yet. A brand is listed here once
                two or more independent violations have been filed against it.
              </p>
            </div>
          ) : (
            <ul className="card divide-y divide-ink-200 overflow-hidden">
              {offenders.map((o) => (
                <li key={o.brand} className="flex items-start gap-3 px-4 py-3.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-bad-soft text-bad-text">
                    <Repeat size={17} strokeWidth={1.9} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-md font-medium text-ink-900">{o.brand}</p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {o.violationCount} violations · {o.districtsAffected}{' '}
                      {o.districtsAffected === 1 ? 'district' : 'districts'}
                    </p>
                    {o.ruleIds.length > 0 && (
                      <p className="mt-1 truncate text-2xs text-ink-400">
                        {o.ruleIds.slice(0, 3).join(' · ')}
                        {o.ruleIds.length > 3 ? ` +${o.ruleIds.length - 3} more` : ''}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 font-display text-lg font-semibold text-bad-text tnum">
                    {o.violationCount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ------------------------------------------------- district table */}
        <div className="pt-7">
          <SectionHeader
            title="District-wise violations"
            action={hotspots.length > 0 ? 'Export CSV' : undefined}
            onAction={() => void downloadCsv(`district-violations-${stamp}.csv`, hotspotsCsv(hotspots))}
          />

          {hotspots.length === 0 ? (
            <div className="card flex items-start gap-3 p-4">
              <MapPinned size={17} className="mt-0.5 shrink-0 text-ink-400" aria-hidden />
              <p className="text-sm leading-relaxed text-ink-600">
                No inspections recorded yet.
              </p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-ink-50 text-2xs uppercase tracking-[0.06em] text-ink-500">
                    <th scope="col" className="px-4 py-2.5 font-semibold">District</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-semibold">Scans</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-semibold">Violations</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-semibold">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200">
                  {hotspots.map((h) => (
                    <tr key={h.district}>
                      <th scope="row" className="px-4 py-2.5 font-medium text-ink-900">
                        {h.district}
                        {h.state && <span className="ml-1.5 font-normal text-ink-400">{h.state}</span>}
                      </th>
                      <td className="px-4 py-2.5 text-right text-ink-700 tnum">{h.totalScans}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-ink-900 tnum">{h.violations}</td>
                      <td className="px-4 py-2.5 text-right text-ink-700 tnum">{h.violationRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------- full export */}
        <div className="pt-7">
          <SectionHeader title="Export" />
          <div className="card p-4">
            <p className="text-sm leading-relaxed text-ink-600">
              Download the case register as a spreadsheet for filing with the
              state Legal Metrology office.
            </p>
            {!live && !loading && (
              <p className="mt-2 text-xs leading-relaxed text-ink-500">
                This export covers scans stored on this device only. Sign in and
                connect to include reports from all users.
              </p>
            )}
            <button
              type="button"
              disabled={hotspots.length === 0}
              onClick={() => void downloadCsv(`district-violations-${stamp}.csv`, hotspotsCsv(hotspots))}
              className="btn-secondary btn-block mt-4 disabled:opacity-50"
            >
              <Download size={17} strokeWidth={2} aria-hidden />
              Export CSV
            </button>
          </div>
        </div>
      </ScrollArea>

      <BottomNav />
    </Screen>
  )
}
