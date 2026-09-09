/**
 * Verifies officer analytics aggregation and its offline fallback.
 *
 * The console has to be honest: when there is no backend it must show data
 * derived from real local scans and flag it as not live, never invent numbers.
 *
 *   node scripts/verify-officer.mjs
 */
import { build } from 'esbuild'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'

/**
 * Absolute path to a source file, as an import specifier.
 *
 * The generated entry file lives in the OS temp directory, so it must import
 * the project by absolute path. On Windows process.cwd() returns backslashes,
 * which esbuild treats as escape sequences inside the import string, mangling
 * the path. Forward slashes are valid import specifiers on every platform.
 */
const ROOT = process.cwd().split('\\').join('/')
const src = (p) => `${ROOT}/${p}`


let failures = 0
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`)
  if (!ok) console.log(`        expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
}

function define(name, value) {
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true })
}
const mem = new Map()
define('localStorage', {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
})
define('navigator', { onLine: true })
define('window', { addEventListener() {} })
define('setInterval', () => 0)

const dir = mkdtempSync(join(tmpdir(), 'cmp-officer-'))
const entry = join(dir, 'entry.ts')
writeFileSync(
  entry,
  `
  export { fetchHotspots, fetchOffenders, summarise, tierFor, centroidFor, toCsv, offendersCsv, projectToMap, plottable } from '${src('src/lib/officer')}'
  export { useApp } from '${src('src/store/app')}'
  `,
)
const out = join(dir, 'bundle.mjs')

// Stub supabase and sync so nothing touches a network client.
const stub = {
  name: 'stub',
  setup(b) {
    b.onResolve({ filter: /\/supabase$/ }, () => ({ path: 's', namespace: 'stub-sb' }))
    b.onLoad({ filter: /.*/, namespace: 'stub-sb' }, () => ({
      contents: `
        export const backendConfigured = () => globalThis.__configured === true
        export const getSupabase = async () => globalThis.__client ?? null
        export const currentUserId = async () => 'u1'
      `,
      loader: 'ts',
    }))
    b.onResolve({ filter: /\/sync$/ }, () => ({ path: 'q', namespace: 'stub-q' }))
    b.onLoad({ filter: /.*/, namespace: 'stub-q' }, () => ({
      contents: `export const queueScan = () => {}; export const queueComplaint = () => {}; export const flush = async () => 0; export const startSync = () => {}; export const pendingCount = () => 0`,
      loader: 'ts',
    }))
  },
}

await build({
  entryPoints: [entry],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  loader: { '.json': 'json' },
  logLevel: 'error',
  plugins: [stub],
})

const { fetchHotspots, fetchOffenders, summarise, tierFor, centroidFor,
        toCsv, offendersCsv, projectToMap, plottable, useApp } = await import(pathToFileURL(out).href)

function scan(o) {
  return {
    id: o.id,
    createdAt: o.createdAt ?? '2026-03-01T10:00:00.000Z',
    productName: o.productName ?? 'Acme Foods Wafers',
    verdict: o.verdict ?? 'VIOLATION',
    grade: 'C',
    score: 50,
    expired: o.expired ?? false,
    imageDataUrl: '',
    place: o.place ?? 'Gurugram, Haryana',
    barcode: null,
    reader: 'gemini',
    synced: false,
    quality: {},
    findings: (o.failed ?? ['MRP_PRESENT']).map((id) => ({
      id, label: id, statute: 's', message: 'm', guidance: 'g',
      severity: 'critical', passed: false, value: null,
    })),
  }
}

console.log('Officer analytics\n')

/* ─────────────────────────────────────── offline aggregation is real */
{
  globalThis.__configured = false
  useApp.setState({
    scans: [
      scan({ id: '1', place: 'Gurugram, Haryana', verdict: 'VIOLATION' }),
      scan({ id: '2', place: 'Gurugram, Haryana', verdict: 'PASS' }),
      scan({ id: '3', place: 'Gurugram, Haryana', verdict: 'VIOLATION', expired: true }),
      scan({ id: '4', place: 'Mumbai, Maharashtra', verdict: 'PASS' }),
      // A RETAKE is not evidence and must not enter the statistics.
      scan({ id: '5', place: 'Mumbai, Maharashtra', verdict: 'RETAKE' }),
    ],
  })

  const { data, live } = await fetchHotspots()
  check('offline data is flagged as not live', live, false)
  check('districts are grouped', data.length, 2)

  const ggn = data.find((d) => d.district === 'Gurugram')
  check('scan count excludes retakes', ggn.totalScans, 3)
  check('violations counted', ggn.violations, 2)
  check('expired products counted', ggn.expiredFound, 1)
  check('violation rate is a percentage', ggn.violationRate, 66.7)
  check('state is split out', ggn.state, 'Haryana')
  check('a known district gets a centroid', ggn.lat, 28.46)

  const mum = data.find((d) => d.district === 'Mumbai')
  check('retake excluded from the other district too', mum.totalScans, 1)
  check('sorted by violations, worst first', data[0].district, 'Gurugram')
  console.log()
}

/* ────────────────────────────────────────────── repeat offenders */
{
  globalThis.__configured = false
  useApp.setState({
    scans: [
      scan({ id: '1', productName: 'Acme Foods Wafers', place: 'Delhi, NCT' }),
      scan({ id: '2', productName: 'Acme Foods Namkeen', place: 'Mumbai, Maharashtra',
             failed: ['MRP_PRESENT', 'CUSTOMER_CARE_PRESENT'] }),
      // Only one violation: not yet a repeat offender.
      scan({ id: '3', productName: 'Bright Dairy Milk', place: 'Delhi, NCT' }),
      // A passing scan must never make a brand an offender.
      scan({ id: '4', productName: 'Clean Brand Juice', verdict: 'PASS' }),
    ],
  })

  const { data } = await fetchOffenders()
  check('only brands with 2+ violations appear', data.length, 1)
  check('the repeat offender is identified', data[0].brand, 'Acme Foods')
  check('violations are counted', data[0].violationCount, 2)
  check('districts affected are counted', data[0].districtsAffected, 2)
  check('distinct rules are collected', data[0].ruleIds.sort(),
        ['CUSTOMER_CARE_PRESENT', 'MRP_PRESENT'])
  console.log()
}

/* ───────────────────────────────────────────────── live backend */
{
  globalThis.__configured = true
  globalThis.__client = {
    from: () => ({
      select: () => ({
        order: () => ({
          limit: async () => ({
            data: [
              { district: 'Rajkot', state: 'Gujarat', total_scans: 200,
                violations: 140, expired_found: 12, violation_rate: 70,
                lat: 22.0, lng: 70.0, last_seen: '2026-03-01T00:00:00Z' },
            ],
            error: null,
          }),
        }),
      }),
    }),
  }

  const { data, live } = await fetchHotspots()
  check('backend data is flagged live', live, true)
  check('rows are mapped', data[0].district, 'Rajkot')
  check('counts come from the view', data[0].violations, 140)
  // The averaged point is noisy early on; a known centroid is preferred.
  check('a known centroid overrides the averaged point', data[0].lat, 22.3)
  console.log()
}

/* ──────────────────────────────────── backend failure falls back */
{
  globalThis.__configured = true
  useApp.setState({ scans: [scan({ id: '1', place: 'Patna, Bihar' })] })

  globalThis.__client = {
    from: () => ({
      select: () => ({
        order: () => ({ limit: async () => ({ data: null, error: { message: 'down' } }) }),
      }),
    }),
  }
  let r = await fetchHotspots()
  check('a backend error falls back to local', r.live, false)
  check('and still shows real local data', r.data[0].district, 'Patna')

  globalThis.__client = {
    from: () => ({
      select: () => ({ order: () => ({ limit: async () => { throw new Error('boom') } }) }),
    }),
  }
  r = await fetchHotspots()
  check('a thrown error falls back too', r.live, false)

  define('navigator', { onLine: false })
  globalThis.__client = {
    from: () => { throw new Error('should not be called while offline') },
  }
  r = await fetchHotspots()
  check('offline never queries the backend', r.live, false)
  define('navigator', { onLine: true })
  console.log()
}

/* ─────────────────────────────────────────────────── summary maths */
{
  const hotspots = [
    { district: 'A', totalScans: 100, violations: 60, expiredFound: 5 },
    { district: 'B', totalScans: 100, violations: 20, expiredFound: 3 },
  ]
  const s = summarise(hotspots, [{ brand: 'X' }, { brand: 'Y' }])
  check('total scans add up', s.totalScans, 200)
  check('violations add up', s.violations, 80)
  check('expired add up', s.expiredFound, 8)
  check('overall rate is computed', s.violationRate, 40)
  check('districts counted', s.districtsCovered, 2)
  check('repeat offenders counted', s.repeatOffenders, 2)

  check('an empty console does not divide by zero', summarise([], []).violationRate, 0)
  console.log()
}

/* ───────────────────────────────────────────────────────── tiers */
{
  check('a severe district is high', tierFor(70), 'high')
  check('a moderate district is medium', tierFor(30), 'medium')
  check('a clean district is low', tierFor(5), 'low')
  check('an unknown district has no centroid', centroidFor('Nowhere'), null)
  console.log()
}

/* ────────────────────────────────────────────────────── CSV export */
{
  const csv = toCsv(
    [{ A: 'plain', B: 'has,comma', C: 'has "quote"', D: 'line\nbreak' }],
    ['A', 'B', 'C', 'D'],
  )
  check('a comma is quoted', csv.includes('"has,comma"'), true)
  check('a quote is doubled', csv.includes('"has ""quote"""'), true)
  check('a newline is quoted', csv.includes('"line\nbreak"'), true)
  check('rows are CRLF separated', csv.includes('\r\n'), true)
  // Excel needs the BOM or it mangles Devanagari product names.
  check('a BOM is present for Excel', csv.charCodeAt(0), 0xfeff)

  const offCsv = offendersCsv([
    { brand: 'Acme Foods', violationCount: 3, districtsAffected: 2, reporters: 3,
      ruleIds: ['MRP_PRESENT', 'FSSAI_LICENCE_PRESENT'],
      firstReported: '2026-01-01T00:00:00Z', lastReported: '2026-03-01T00:00:00Z' },
  ])
  check('offender export names the brand', offCsv.includes('Acme Foods'), true)
  check('offender export joins rules readably', offCsv.includes('MRP_PRESENT; FSSAI_LICENCE_PRESENT'), true)
  console.log()
}

/* ────────────────────────────────────────────────── map projection */
{
  const delhi = projectToMap(28.61, 77.21)
  const chennai = projectToMap(13.08, 80.27)
  check('Delhi sits north of Chennai on the map', delhi.y < chennai.y, true)

  const mumbai = projectToMap(19.08, 72.88)
  const kolkata = projectToMap(22.57, 88.36)
  check('Mumbai sits west of Kolkata', mumbai.x < kolkata.x, true)

  const off = projectToMap(80, 200)
  check('an out-of-range point is clamped on x', off.x <= 98, true)
  check('and clamped on y', off.y >= 2, true)

  const plotted = plottable([
    { district: 'Delhi', lat: 28.61, lng: 77.21, violations: 1 },
    { district: 'Unknown', lat: null, lng: null, violations: 1 },
  ])
  check('only locatable districts are plotted', plotted.length, 1)
  check('and they carry map coordinates', typeof plotted[0].x, 'number')
  console.log()
}

console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
