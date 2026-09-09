/**
 * Verifies the online-reader integration WITHOUT calling Gemini.
 *
 * The point is to prove the contract holds regardless of what the network
 * does: a good response is used, every kind of bad response falls back to the
 * on-device reader, and a remote reading still produces a verdict the engine
 * can defend.
 *
 *   node scripts/verify-remote.mjs
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


const dir = mkdtempSync(join(tmpdir(), 'cmp-remote-'))
const entry = join(dir, 'entry.ts')

writeFileSync(
  entry,
  `
  export { remoteExtract, remoteConfigured } from '${src('src/lib/remoteExtract')}'
  export { runEngine } from '${src('src/lib/engine')}'
  `,
)

const out = join(dir, 'bundle.mjs')

let failures = 0
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`)
  if (!ok) console.log(`        expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
}

/* ------------------------------------------------ browser shims for Node */

/**
 * Node 21+ exposes `navigator` as a getter-only global, so a plain assignment
 * throws. defineProperty works on every version we support.
 */
function setOnline(onLine) {
  Object.defineProperty(globalThis, 'navigator', {
    value: { onLine },
    configurable: true,
    writable: true,
  })
}
setOnline(true)

class FakeFileReader {
  readAsDataURL(blob) {
    Promise.resolve(blob.text()).then((t) => {
      this.result = `data:image/jpeg;base64,${Buffer.from(t).toString('base64')}`
      this.onload?.()
    })
  }
}
Object.defineProperty(globalThis, 'FileReader', {
  value: FakeFileReader,
  configurable: true,
  writable: true,
})

const IMAGE = new Blob(['fake-jpeg-bytes'], { type: 'image/jpeg' })

/** Swap in a fetch that returns whatever the test needs. */
function mockFetch(impl) {
  globalThis.fetch = impl
}

/* --------------------------------------------------------------- build */

await build({
  entryPoints: [entry],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  loader: { '.json': 'json' },
  logLevel: 'error',
  define: {
    'import.meta.env.VITE_EXTRACT_URL': '"https://example.test/functions/v1/extract-label"',
    'import.meta.env.VITE_SUPABASE_ANON_KEY': '"test-anon-key"',
  },
})

const { remoteExtract, remoteConfigured, runEngine } = await import(pathToFileURL(out).href)

console.log('Online-reader contract\n')

check('endpoint is detected as configured', remoteConfigured(), true)

/* ------------------------------------------------------- happy path */
{
  mockFetch(async () => ({
    ok: true,
    json: async () => ({
      source: 'gemini',
      fields: {
        mrp: '₹45.00',
        net_qty: '200 g',
        mfg_month_year: '03/2026',
        expiry: '12/2027',
        manufacturer: 'Namkeen Foods Pvt Ltd, Pune',
        customer_care: '1800 222 333',
        phone: '1800 222 333',
        fssai_licence: '10012041000123',
        fssai_logo: 'present',
        veg_symbol: 'veg',
        ingredients: 'Potato, Edible Vegetable Oil, Iodised Salt',
        generic_name: 'CRISPY POTATO WAFERS',
        product_category: 'snack',
        raw_text: 'CRISPY POTATO WAFERS\nMRP Rs. 45.00 inclusive of all taxes\nNet Weight: 200 g',
        legibility: 0.94,
      },
    }),
  }))

  const r = await remoteExtract(IMAGE)
  check('a good response is parsed', r !== null, true)
  check('mrp is carried through', r?.fields.mrp.value, '₹45.00')
  check('legibility becomes confidence', r?.fields.mrp.confidence, 0.94)
  check('absent field is null, not undefined', r?.fields.batch.value, null)
  check('non-pan-masala category is normalised to null', r?.category, null)

  // The engine must still be the thing that decides.
  const verdict = runEngine(r.fields, r.category, { fullText: r.rawText })
  check('remote fields yield a PASS through the engine', verdict.verdict, 'PASS')
  check('grade comes from the engine, not the model', verdict.grade, 'A')
  console.log()
}

/* ------------------------------------------- pan masala classification */
{
  mockFetch(async () => ({
    ok: true,
    json: async () => ({
      fields: {
        net_qty: '8 g',
        fssai_licence: '10012041000999',
        product_category: 'pan_masala',
        raw_text: 'SUPREME PAN MASALA\nNet Weight: 8 g',
        legibility: 0.9,
      },
    }),
  }))

  const r = await remoteExtract(IMAGE)
  check('pan masala category is preserved', r?.category, 'pan_masala')

  const verdict = runEngine(r.fields, r.category, { fullText: r.rawText })
  check(
    'small pan masala pack still requires RSP (GSR 881(E))',
    verdict.violations.some((v) => v.id === 'PAN_MASALA_RSP_ALL_SIZES'),
    true,
  )
  console.log()
}

/* ------------------------------------------------------ failure modes */
{
  mockFetch(async () => ({ ok: false, status: 500, json: async () => ({}) }))
  check('server error falls back', await remoteExtract(IMAGE), null)

  mockFetch(async () => ({ ok: false, status: 429, json: async () => ({}) }))
  check('rate limit falls back', await remoteExtract(IMAGE), null)

  mockFetch(async () => ({ ok: true, json: async () => ({ error: 'unreadable' }) }))
  check('response without fields falls back', await remoteExtract(IMAGE), null)

  mockFetch(async () => {
    throw new TypeError('network down')
  })
  check('network failure falls back', await remoteExtract(IMAGE), null)

  mockFetch(async () => ({
    ok: true,
    json: async () => {
      throw new SyntaxError('not json')
    },
  }))
  check('malformed JSON falls back', await remoteExtract(IMAGE), null)

  mockFetch(async (_u, init) => {
    // Simulate the abort the 12s timeout would raise.
    const err = new Error('aborted')
    err.name = 'AbortError'
    if (init?.signal) throw err
    throw err
  })
  check('timeout falls back', await remoteExtract(IMAGE), null)

  setOnline(false)
  mockFetch(async () => {
    throw new Error('fetch should never be called while offline')
  })
  check('offline never calls the network', await remoteExtract(IMAGE), null)
  /**
 * Node 21+ exposes `navigator` as a getter-only global, so a plain assignment
 * throws. defineProperty works on every version we support.
 */
function setOnline(onLine) {
  Object.defineProperty(globalThis, 'navigator', {
    value: { onLine },
    configurable: true,
    writable: true,
  })
}
setOnline(true)
  console.log()
}

/* ----------------------------------------------- unconfigured endpoint */
{
  const dir2 = mkdtempSync(join(tmpdir(), 'cmp-unconf-'))
  const e2 = join(dir2, 'e.ts')
  writeFileSync(e2, `export { remoteExtract, remoteConfigured } from '${src('src/lib/remoteExtract')}'`)
  const o2 = join(dir2, 'b.mjs')
  await build({
    entryPoints: [e2],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: o2,
    logLevel: 'error',
    define: {
      'import.meta.env.VITE_EXTRACT_URL': 'undefined',
      'import.meta.env.VITE_SUPABASE_ANON_KEY': 'undefined',
    },
  })
  const m2 = await import(pathToFileURL(o2).href)
  check('no endpoint means not configured', m2.remoteConfigured(), false)

  mockFetch(async () => {
    throw new Error('fetch should never be called without an endpoint')
  })
  check('no endpoint means no network call', await m2.remoteExtract(IMAGE), null)
  console.log()
}

console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
