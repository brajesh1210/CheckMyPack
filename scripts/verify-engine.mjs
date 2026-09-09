/**
 * Engine verification harness.
 *
 * Compiles the real extract.ts + engine.ts and runs them against the exact
 * label text used by the demo samples, so we know the verdicts are produced
 * by the rule engine and not by hard-coding.
 *
 *   node scripts/verify-engine.mjs
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


const dir = mkdtempSync(join(tmpdir(), 'cmp-'))
const entry = join(dir, 'entry.ts')

writeFileSync(
  entry,
  `
  export { extractFields, extractionQuality } from '${src('src/lib/extract')}'
  export { runEngine, parseLabelDate, rulesMeta } from '${src('src/lib/engine')}'
  `,
)

const out = join(dir, 'bundle.mjs')
await build({
  entryPoints: [entry],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  loader: { '.json': 'json' },
  logLevel: 'error',
})

const { extractFields, extractionQuality, runEngine, parseLabelDate, rulesMeta } = await import(pathToFileURL(out).href)

const COMPLIANT = `CRISPY POTATO WAFERS
Ingredients: Potato, Edible Vegetable Oil,
Iodised Salt, Spices and Condiments
Net Weight: 200 g
MRP Rs. 45.00 (inclusive of all taxes)
Mfg: 03/2026        Best Before: 12/2027
Batch No: KP2263
FSSAI Lic. No. 10012041000123
Veg
Manufactured & Packed by:
Namkeen Foods Pvt Ltd, Plot 14,
MIDC Industrial Area, Pune 411019
Country of Origin: India
Customer Care: 1800 222 333
care@namkeenfoods.example`

const VIOLATION = `MASALA MUNCH MIXTURE
Ingredients: Gram Flour, Edible Vegetable Oil,
Peanuts, Iodised Salt, Spices
Net Weight: 150 g
Mfg: 01/2026        Best Before: 09/2026
Batch No: MM8891
FSSAI Lic. No. 20815022000456
Veg
Manufactured & Packed by:
Snack Corner Industries, Shed 8,
GIDC Estate, Rajkot 360003
Country of Origin: India`

const PAN_MASALA = `SUPREME PAN MASALA
Net Weight: 8 g
Mfg: 05/2026   Best Before: 05/2027
FSSAI Lic. No. 10012041000999
Manufactured by: Supreme Products, Kanpur
Customer Care: 1800 100 200`

const mkOcr = (text) => ({ text, lines: text.split('\n'), words: [], confidence: 0.88, width: 900, height: 1200 })

let failures = 0
function check(name, actual, expected) {
  const ok = actual === expected
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}\n        expected ${expected}, got ${actual}`)
}

console.log(`rules.json v${rulesMeta.version} — ${rulesMeta.ruleCount} rules\n`)

// ---------------------------------------------------------------- compliant
{
  const { fields, category } = extractFields(mkOcr(COMPLIANT), 900, 1200)
  const exq = extractionQuality(fields)
  const r = runEngine(fields, category, { unreliable: exq.unreliable, fullText: COMPLIANT })
  console.log('--- Compliant sample ---')
  console.log('  mrp         :', fields.mrp.value)
  console.log('  net_qty     :', fields.net_qty.value)
  console.log('  mfg         :', fields.mfg_month_year.value)
  console.log('  expiry      :', fields.expiry.value)
  console.log('  fssai       :', fields.fssai_licence.value)
  console.log('  care/phone  :', fields.customer_care.value, '/', fields.phone.value)
  console.log('  generic_name:', fields.generic_name.value)
  console.log('  violations  :', r.violations.map((v) => v.id).join(', ') || 'none')
  check('compliant verdict', r.verdict, 'PASS')
  check('compliant grade', r.grade, 'A')
  check('compliant not expired', r.expired, false)
  console.log()
}

// ---------------------------------------------------------------- violation
{
  const { fields, category } = extractFields(mkOcr(VIOLATION), 900, 1200)
  const exq = extractionQuality(fields)
  const r = runEngine(fields, category, { unreliable: exq.unreliable, fullText: VIOLATION })
  console.log('--- Violation sample (no MRP, no customer care) ---')
  console.log('  mrp         :', fields.mrp.value)
  console.log('  customer    :', fields.customer_care.value)
  console.log('  violations  :', r.violations.map((v) => `${v.id}[${v.severity}]`).join(', '))
  check('violation verdict', r.verdict, 'VIOLATION')
  check('violation grade', r.grade, 'C')
  check('MRP flagged', r.violations.some((v) => v.id === 'MRP_PRESENT'), true)
  // Best before 09/2026 resolves to 30 Sep 2026, which is still in the future today.
  check('BB 09/2026 not yet expired', r.expired, false)
  console.log()
}

// ------------------------------------------------------- pan masala amendment
{
  const { fields, category } = extractFields(mkOcr(PAN_MASALA), 900, 1200)
  const r = runEngine(fields, category, { fullText: PAN_MASALA })
  console.log('--- Pan masala 8 g (GSR 881(E)) ---')
  console.log('  category    :', category)
  console.log('  violations  :', r.violations.map((v) => v.id).join(', '))
  check('detects pan masala category', category, 'pan_masala')
  check('RSP required on small pack', r.violations.some((v) => v.id === 'PAN_MASALA_RSP_ALL_SIZES'), true)
  console.log()
}

// ------------------------------------------------------------------ retake
{
  const r = runEngine({}, null, { unreliable: true })
  console.log('--- Unreadable photo ---')
  check('unreadable never accuses', r.verdict, 'RETAKE')
  check('no violations emitted', r.violations.length, 0)
  console.log()
}

// -------------------------------------------------------------- date parsing
{
  console.log('--- Date parsing ---')
  check('03/2026 parses', parseLabelDate('03/2026') instanceof Date, true)
  check('12/03/2026 parses', parseLabelDate('12/03/2026') instanceof Date, true)
  check('mar 2026 parses', parseLabelDate('mar 2026') instanceof Date, true)
  check('garbage rejected', parseLabelDate('xx'), null)
  console.log()
}

console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
