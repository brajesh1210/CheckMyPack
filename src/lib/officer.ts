/**
 * Officer analytics.
 *
 * Reads the aggregate views created in migration 0001. Individual scan rows are
 * never fetched here — an officer sees where violations cluster and which
 * brands repeat, not who reported what.
 *
 * Every function degrades to locally-derived data when the backend is not
 * configured or unreachable, so the officer console still demonstrates
 * correctly offline. The `live` flag on each result says which happened, and
 * the UI is expected to label demo data honestly rather than passing it off as
 * real.
 */

import { getSupabase, backendConfigured } from './supabase'
import { useApp, type StoredScan } from '../store/app'

export interface Hotspot {
  district: string
  state: string | null
  totalScans: number
  violations: number
  expiredFound: number
  violationRate: number
  lat: number | null
  lng: number | null
  lastSeen: string | null
}

export interface Offender {
  brand: string
  violationCount: number
  districtsAffected: number
  reporters: number
  ruleIds: string[]
  firstReported: string | null
  lastReported: string | null
}

export interface OfficerSummary {
  totalScans: number
  violations: number
  expiredFound: number
  violationRate: number
  districtsCovered: number
  repeatOffenders: number
}

export interface Live<T> {
  data: T
  /** True when this came from the backend rather than local demo data. */
  live: boolean
}

/* ────────────────────────────── approximate centroids for the map */

/**
 * District centroids for the districts we can plot. The database stores a
 * coarse point per scan, but early on most districts have too few scans for
 * the average to be meaningful, so a known centroid gives a stabler pin.
 */
const CENTROIDS: Record<string, [number, number]> = {
  Delhi: [28.61, 77.21],
  'New Delhi': [28.61, 77.21],
  Gurugram: [28.46, 77.03],
  Noida: [28.54, 77.39],
  Mumbai: [19.08, 72.88],
  Pune: [18.52, 73.86],
  Nagpur: [21.15, 79.09],
  Rajkot: [22.3, 70.8],
  Ahmedabad: [23.02, 72.57],
  Surat: [21.17, 72.83],
  Kolkata: [22.57, 88.36],
  Chennai: [13.08, 80.27],
  Coimbatore: [11.02, 76.96],
  Bengaluru: [12.97, 77.59],
  Hyderabad: [17.39, 78.49],
  Lucknow: [26.85, 80.95],
  Kanpur: [26.45, 80.33],
  Varanasi: [25.32, 82.97],
  Patna: [25.59, 85.14],
  Jaipur: [26.91, 75.79],
  Bhopal: [23.26, 77.41],
  Indore: [22.72, 75.86],
  Guwahati: [26.14, 91.74],
  Chandigarh: [30.73, 76.78],
  Ludhiana: [30.9, 75.86],
  Kochi: [9.93, 76.27],
  Thiruvananthapuram: [8.52, 76.94],
  Bhubaneswar: [20.3, 85.82],
  Raipur: [21.25, 81.63],
  Ranchi: [23.34, 85.31],
  Dehradun: [30.32, 78.03],
  Srinagar: [34.08, 74.8],
  Visakhapatnam: [17.69, 83.22],
}

export function centroidFor(district: string): [number, number] | null {
  return CENTROIDS[district] ?? null
}

/* ─────────────────────────────────────────────── local fallback data */

/**
 * Derives hotspots from whatever is in this device's own history. Small, but
 * honest: it is real data from real scans, just only this officer's.
 */
function localHotspots(scans: StoredScan[]): Hotspot[] {
  const byDistrict = new Map<string, Hotspot>()

  for (const s of scans) {
    if (s.verdict === 'RETAKE') continue
    const [district, state] = s.place.split(',').map((p) => p.trim())
    if (!district) continue

    const existing = byDistrict.get(district) ?? {
      district,
      state: state ?? null,
      totalScans: 0,
      violations: 0,
      expiredFound: 0,
      violationRate: 0,
      lat: centroidFor(district)?.[0] ?? null,
      lng: centroidFor(district)?.[1] ?? null,
      lastSeen: null,
    }

    existing.totalScans++
    if (s.verdict === 'VIOLATION') existing.violations++
    if (s.expired) existing.expiredFound++
    if (!existing.lastSeen || s.createdAt > existing.lastSeen) existing.lastSeen = s.createdAt

    byDistrict.set(district, existing)
  }

  return [...byDistrict.values()]
    .map((h) => ({
      ...h,
      violationRate: h.totalScans ? Math.round((1000 * h.violations) / h.totalScans) / 10 : 0,
    }))
    .sort((a, b) => b.violations - a.violations)
}

function localOffenders(scans: StoredScan[]): Offender[] {
  const byBrand = new Map<string, Offender>()

  for (const s of scans) {
    if (s.verdict !== 'VIOLATION') continue
    const brand = s.productName.split(/\s+/).slice(0, 2).join(' ')
    if (!brand) continue

    const [district] = s.place.split(',').map((p) => p.trim())
    const existing = byBrand.get(brand) ?? {
      brand,
      violationCount: 0,
      districtsAffected: 0,
      reporters: 1,
      ruleIds: [],
      firstReported: s.createdAt,
      lastReported: s.createdAt,
    }

    existing.violationCount++
    const rules = new Set(existing.ruleIds)
    s.findings.filter((f) => !f.passed).forEach((f) => rules.add(f.id))
    existing.ruleIds = [...rules]

    const districts = new Set<string>(
      (existing as Offender & { _d?: string[] })._d ?? [],
    )
    if (district) districts.add(district)
    ;(existing as Offender & { _d?: string[] })._d = [...districts]
    existing.districtsAffected = districts.size

    if (s.createdAt < (existing.firstReported ?? '')) existing.firstReported = s.createdAt
    if (s.createdAt > (existing.lastReported ?? '')) existing.lastReported = s.createdAt

    byBrand.set(brand, existing)
  }

  return [...byBrand.values()]
    .filter((o) => o.violationCount >= 2)
    .sort((a, b) => b.violationCount - a.violationCount)
}

/* ──────────────────────────────────────────────────── public API */

export async function fetchHotspots(): Promise<Live<Hotspot[]>> {
  const local = () => ({ data: localHotspots(useApp.getState().scans), live: false })

  if (!backendConfigured() || !navigator.onLine) return local()

  try {
    const sb = await getSupabase()
    if (!sb) return local()

    const { data, error } = await sb
      .from('violation_hotspots')
      .select('*')
      .order('violations', { ascending: false })
      .limit(100)

    if (error || !data) return local()

    return {
      live: true,
      data: data.map((r: Record<string, unknown>) => {
        const district = String(r.district ?? '')
        const centroid = centroidFor(district)
        return {
          district,
          state: (r.state as string) ?? null,
          totalScans: Number(r.total_scans ?? 0),
          violations: Number(r.violations ?? 0),
          expiredFound: Number(r.expired_found ?? 0),
          violationRate: Number(r.violation_rate ?? 0),
          // Prefer a known centroid; fall back to the averaged point.
          lat: centroid?.[0] ?? (r.lat != null ? Number(r.lat) : null),
          lng: centroid?.[1] ?? (r.lng != null ? Number(r.lng) : null),
          lastSeen: (r.last_seen as string) ?? null,
        }
      }),
    }
  } catch {
    return local()
  }
}

export async function fetchOffenders(): Promise<Live<Offender[]>> {
  const local = () => ({ data: localOffenders(useApp.getState().scans), live: false })

  if (!backendConfigured() || !navigator.onLine) return local()

  try {
    const sb = await getSupabase()
    if (!sb) return local()

    const { data, error } = await sb
      .from('repeat_offenders')
      .select('*')
      .order('violation_count', { ascending: false })
      .limit(50)

    if (error || !data) return local()

    return {
      live: true,
      data: data.map((r: Record<string, unknown>) => ({
        brand: String(r.brand ?? ''),
        violationCount: Number(r.violation_count ?? 0),
        districtsAffected: Number(r.districts_affected ?? 0),
        reporters: Number(r.reporters ?? 0),
        ruleIds: (r.rule_ids as string[]) ?? [],
        firstReported: (r.first_reported as string) ?? null,
        lastReported: (r.last_reported as string) ?? null,
      })),
    }
  } catch {
    return local()
  }
}

/** Headline numbers for the officer dashboard, derived from the hotspots. */
export function summarise(hotspots: Hotspot[], offenders: Offender[]): OfficerSummary {
  const totalScans = hotspots.reduce((n, h) => n + h.totalScans, 0)
  const violations = hotspots.reduce((n, h) => n + h.violations, 0)
  return {
    totalScans,
    violations,
    expiredFound: hotspots.reduce((n, h) => n + h.expiredFound, 0),
    violationRate: totalScans ? Math.round((1000 * violations) / totalScans) / 10 : 0,
    districtsCovered: hotspots.length,
    repeatOffenders: offenders.length,
  }
}

/** Severity tier used to colour a pin or a row. */
export function tierFor(rate: number): 'high' | 'medium' | 'low' {
  return rate >= 50 ? 'high' : rate >= 20 ? 'medium' : 'low'
}

/**
 * Projects a lat/lng onto the schematic India map used by the officer heat
 * map, whose viewBox is 0..100 wide and 0..105 tall.
 *
 * This is a plain linear fit over the country's bounding box, not a real
 * projection. The underlying artwork is a stylised outline rather than a
 * survey map, so anything more rigorous would imply a precision the drawing
 * does not have.
 */
const BOUNDS = { minLat: 6.5, maxLat: 36.0, minLng: 68.0, maxLng: 97.5 }

export function projectToMap(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100
  const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 105
  // Clamp so a bad coordinate lands on the edge rather than off-canvas.
  return {
    x: Math.max(2, Math.min(98, x)),
    y: Math.max(2, Math.min(103, y)),
  }
}

/** A hotspot with map coordinates attached, ready to plot. */
export interface PlottedHotspot extends Hotspot {
  x: number
  y: number
}

/** Keeps only the hotspots we can place, and projects them. */
export function plottable(hotspots: Hotspot[]): PlottedHotspot[] {
  return hotspots
    .filter((h) => h.lat != null && h.lng != null)
    .map((h) => ({ ...h, ...projectToMap(h.lat!, h.lng!) }))
}

/* ─────────────────────────────────────────────────────── CSV export */

function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v)
  // Quote anything containing a delimiter, quote or newline, per RFC 4180.
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(rows: Record<string, unknown>[], headers: string[]): string {
  const lines = [headers.map(csvCell).join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => csvCell(row[h])).join(','))
  }
  // CRLF and a BOM so the file opens correctly in Excel, which is what a
  // Legal Metrology office will actually use.
  return '\uFEFF' + lines.join('\r\n')
}

export function hotspotsCsv(hotspots: Hotspot[]): string {
  return toCsv(
    hotspots.map((h) => ({
      District: h.district,
      State: h.state ?? '',
      'Total scans': h.totalScans,
      Violations: h.violations,
      'Expired found': h.expiredFound,
      'Violation rate (%)': h.violationRate,
      Priority: tierFor(h.violationRate),
      'Last reported': h.lastSeen ? new Date(h.lastSeen).toLocaleString('en-IN') : '',
    })),
    ['District', 'State', 'Total scans', 'Violations', 'Expired found',
     'Violation rate (%)', 'Priority', 'Last reported'],
  )
}

export function offendersCsv(offenders: Offender[]): string {
  return toCsv(
    offenders.map((o) => ({
      Brand: o.brand,
      Violations: o.violationCount,
      'Districts affected': o.districtsAffected,
      'Independent reporters': o.reporters,
      'Rules breached': o.ruleIds.join('; '),
      'First reported': o.firstReported ? new Date(o.firstReported).toLocaleDateString('en-IN') : '',
      'Last reported': o.lastReported ? new Date(o.lastReported).toLocaleDateString('en-IN') : '',
    })),
    ['Brand', 'Violations', 'Districts affected', 'Independent reporters',
     'Rules breached', 'First reported', 'Last reported'],
  )
}

/** Triggers a download of a CSV string, or shares it on Android. */
export async function downloadCsv(filename: string, csv: string): Promise<void> {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })

  const { shareBinaryFile } = await import('./native')
  if (await shareBinaryFile(filename, blob, 'CheckMyPack export')) return

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
