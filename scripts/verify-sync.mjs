/**
 * Verifies the offline-first sync queue WITHOUT touching a real Supabase
 * project.
 *
 * What matters here is not the happy path — it is that a scan is never lost,
 * never duplicated, never retried forever, and that a guest or an offline user
 * silently accumulates work instead of seeing an error.
 *
 *   node scripts/verify-sync.mjs
 */
import { build } from 'esbuild'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let failures = 0
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`)
  if (!ok) console.log(`        expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
}

/* ───────────────────────────────────────────── browser shims for Node */

function define(name, value) {
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true })
}

const store = new Map()
define('localStorage', {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
})
define('navigator', { onLine: true })
define('window', { addEventListener() {} })
define('setInterval', () => 0)

/* ────────────────────────────────────────────── controllable fake backend */

const backend = {
  scans: [],
  complaints: [],
  failNext: 0,
  failCode: undefined,
  calls: 0,
  reset() {
    this.scans = []
    this.complaints = []
    this.failNext = 0
    this.failCode = undefined
    this.calls = 0
  },
}

const fakeClient = {
  auth: { getSession: async () => ({ data: { session: { user: { id: 'user-1' } } } }) },
  from(table) {
    return {
      upsert: async (row) => {
        backend.calls++
        if (backend.failNext > 0) {
          backend.failNext--
          return { error: { message: 'boom', code: backend.failCode } }
        }
        const i = backend.scans.findIndex((r) => r.id === row.id)
        if (i >= 0) backend.scans[i] = row
        else backend.scans.push(row)
        return { error: null }
      },
      insert: async (row) => {
        backend.calls++
        if (backend.failNext > 0) {
          backend.failNext--
          return { error: { message: 'boom', code: backend.failCode } }
        }
        backend[table].push(row)
        return { error: null }
      },
    }
  },
}

/* ──────────────────────────────────────────────────────────────── build */

const dir = mkdtempSync(join(tmpdir(), 'cmp-sync-'))
const entry = join(dir, 'entry.ts')
writeFileSync(
  entry,
  `export { queueScan, queueComplaint, flush, pendingCount, scanToRow } from '${process.cwd()}/src/lib/sync'`,
)
const out = join(dir, 'bundle.mjs')

// Stub the supabase module so no network client is ever constructed.
const stubPlugin = {
  name: 'stub-supabase',
  setup(b) {
    b.onResolve({ filter: /\/supabase$/ }, () => ({ path: 'stub-supabase', namespace: 'stub' }))
    b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
      contents: `
        export const backendConfigured = () => globalThis.__configured !== false
        export const getSupabase = async () => globalThis.__client
        export const currentUserId = async () => globalThis.__userId
      `,
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
  logLevel: 'error',
  plugins: [stubPlugin],
})

const { queueScan, queueComplaint, flush, pendingCount, scanToRow } = await import(out)

globalThis.__client = fakeClient
globalThis.__userId = 'user-1'
globalThis.__configured = true

const SCAN = {
  id: 'CMP-1111-2222',
  createdAt: '2026-03-01T10:00:00.000Z',
  productName: 'Namkeen Foods Crispy Wafers',
  verdict: 'VIOLATION',
  grade: 'C',
  score: 55,
  expired: false,
  imageDataUrl: 'data:image/jpeg;base64,SECRET_PHOTO_BYTES',
  place: 'Gurugram, Haryana',
  barcode: '8901234567890',
  reader: 'gemini',
  synced: false,
  findings: [{ id: 'MRP_PRESENT', passed: false, severity: 'critical' }],
  quality: { sharpness: 0.8, glare: 0.1, luma: 0.5, contrast: 0.6, pass: true, reasons: [] },
}

console.log('Sync queue contract\n')

/* ───────────────────────────────────────────────────── payload shaping */
{
  const row = scanToRow(SCAN, 'user-1', '1.1.0')
  check('district is split out of place', row.district, 'Gurugram')
  check('state is split out of place', row.state, 'Haryana')
  check('rules version is recorded', row.rules_version, '1.1.0')
  check('reader is recorded for auditing', row.reader, 'gemini')
  // Privacy: the photo may show a person, a shop front or a bill.
  check('the image is never uploaded', 'image_data_url' in row || 'imageDataUrl' in row, false)
  check('no raw image field leaks under any name',
    Object.values(row).some((v) => typeof v === 'string' && v.includes('SECRET_PHOTO_BYTES')), false)
  console.log()
}

/* ──────────────────────────────────────────────────────── happy path */
{
  store.clear()
  backend.reset()
  queueScan(SCAN, '1.1.0')
  await flush()
  check('scan reaches the backend', backend.scans.length, 1)
  check('queue is emptied after success', pendingCount(), 0)
  console.log()
}

/* ─────────────────────────────────────────────── RETAKE is not evidence */
{
  store.clear()
  backend.reset()
  queueScan({ ...SCAN, verdict: 'RETAKE' }, '1.1.0')
  check('an unreadable photo is never queued', pendingCount(), 0)
  await flush()
  check('and never uploaded', backend.scans.length, 0)
  console.log()
}

/* ──────────────────────────────────────────────────────────── guests */
{
  store.clear()
  backend.reset()
  globalThis.__userId = null
  queueScan(SCAN, '1.1.0')
  await flush()
  check('a guest uploads nothing', backend.calls, 0)
  check('but the work is kept for later', pendingCount(), 1)

  globalThis.__userId = 'user-1'
  await flush()
  check('signing in drains the backlog', backend.scans.length, 1)
  check('queue is clear afterwards', pendingCount(), 0)
  console.log()
}

/* ─────────────────────────────────────────────────────────── offline */
{
  store.clear()
  backend.reset()
  define('navigator', { onLine: false })
  queueScan(SCAN, '1.1.0')
  await flush()
  check('offline makes no network call', backend.calls, 0)
  check('offline work is retained', pendingCount(), 1)

  define('navigator', { onLine: true })
  await flush()
  check('reconnecting sends it', backend.scans.length, 1)
  console.log()
}

/* ─────────────────────────────────────────────────── no duplicates */
{
  store.clear()
  backend.reset()
  queueScan(SCAN, '1.1.0')
  queueScan(SCAN, '1.1.0') // e.g. the user re-opened the result screen
  check('queueing twice stores one item', pendingCount(), 1)
  await flush()
  check('one row, not two', backend.scans.length, 1)

  // An ambiguous failure followed by a retry must also not duplicate.
  backend.failNext = 1
  queueScan({ ...SCAN, id: 'CMP-3333-4444' }, '1.1.0')
  await flush()
  check('failed upload stays queued', pendingCount(), 1)
  // First retry is due after BASE_DELAY_MS (2000) plus up to 1000ms of
  // jitter, so wait past the worst case rather than the average — otherwise
  // this assertion fails a third of the time.
  await new Promise((r) => setTimeout(r, 3200))
  await flush()
  check('retry succeeds', backend.scans.length, 2)
  check('and does not duplicate', backend.scans.filter((s) => s.id === 'CMP-3333-4444').length, 1)
  console.log()
}

/* ────────────────────────────────────────────── permanent failures */
{
  store.clear()
  backend.reset()
  backend.failNext = 99
  backend.failCode = '42501' // RLS denied — retrying can never help
  queueScan(SCAN, '1.1.0')
  await flush()
  check('a rejected row is dropped, not retried forever', pendingCount(), 0)
  check('only one attempt was made', backend.calls, 1)
  console.log()
}

/* ──────────────────────────────────────────── backoff is respected */
{
  store.clear()
  backend.reset()
  backend.failNext = 99
  backend.failCode = undefined // transient
  queueScan(SCAN, '1.1.0')
  await flush()
  const after = backend.calls
  await flush() // immediately again — backoff should suppress this
  check('backoff prevents an immediate retry', backend.calls, after)
  check('item is still queued', pendingCount(), 1)
  console.log()
}

/* ──────────────────────────────────────────────────────── complaints */
{
  store.clear()
  backend.reset()
  queueComplaint({ scanId: SCAN.id, channel: 'helpline_14404', district: 'Gurugram' })
  await flush()
  check('complaint is delivered', backend.complaints.length, 1)
  check('it links back to the scan', backend.complaints[0].scan_id, SCAN.id)
  console.log()
}

/* ─────────────────────────────────────────────── unconfigured build */
{
  store.clear()
  backend.reset()
  globalThis.__configured = false
  queueScan(SCAN, '1.1.0')
  check('no backend means nothing is queued', pendingCount(), 0)
  await flush()
  check('and no calls are made', backend.calls, 0)
  globalThis.__configured = true
  console.log()
}

console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
