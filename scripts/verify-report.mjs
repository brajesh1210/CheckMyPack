/**
 * Verifies the QR verification payload.
 *
 * The QR is the part of the report that has to survive being printed,
 * photocopied and scanned across the counter, so the two things that matter
 * are: it round-trips exactly, and it stays small enough to scan reliably.
 *
 *   node scripts/verify-report.mjs
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
function report(name, value) {
  console.log(`      ${name}: ${value}`)
}

const dir = mkdtempSync(join(tmpdir(), 'cmp-report-'))
const entry = join(dir, 'entry.ts')
writeFileSync(
  entry,
  `
  export { encodePayload, decodePayload, buildPayload, PAYLOAD_VERSION } from '${src('src/lib/verifyCode')}'
  export { rulesMeta } from '${src('src/lib/engine')}'
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

const { encodePayload, decodePayload, rulesMeta } = await import(pathToFileURL(out).href)

/** A realistic worst case: every rule in the document has failed. */
function scanWith(failedIds, overrides = {}) {
  return {
    id: 'CMP-4821-7390',
    createdAt: '2026-03-14T09:41:00.000Z',
    productName: 'Namkeen Foods Crispy Potato Wafers Masala',
    verdict: failedIds.length ? 'VIOLATION' : 'PASS',
    grade: failedIds.length ? 'C' : 'A',
    score: failedIds.length ? 48 : 96,
    expired: false,
    imageDataUrl: 'data:image/jpeg;base64,AAAA',
    place: 'Gurugram, Haryana',
    barcode: '8901234567890',
    reader: 'gemini',
    synced: false,
    quality: {},
    findings: rulesMeta.ids.map((id) => ({
      id,
      label: id,
      statute: 'LMPC 2011 r.6',
      message: 'x',
      guidance: 'y',
      severity: 'critical',
      passed: !failedIds.includes(id),
      value: null,
    })),
    ...overrides,
  }
}

console.log('Report QR payload\n')

/* ───────────────────────────────────────────────────── round trip */
{
  const failed = ['MRP_PRESENT', 'MRP_INCLUSIVE_OF_TAXES', 'CUSTOMER_CARE_PRESENT']
  const scan = scanWith(failed)
  const encoded = encodePayload(scan)
  const d = decodePayload(encoded)

  check('decodes', d !== null, true)
  check('scan id survives', d.id, scan.id)
  check('verdict survives', d.verdict, 'VIOLATION')
  check('grade survives', d.grade, 'C')
  check('score survives', d.score, 48)
  check('failed rules survive exactly', d.failedRuleIds, failed)
  check('timestamp round-trips to the minute', d.scannedAt, '2026-03-14T09:41:00.000Z')
  check('rules version matches this build', d.rulesVersionMismatch, false)
  console.log()
}

/* ──────────────────────────────────────────── a clean pass encodes */
{
  const d = decodePayload(encodePayload(scanWith([])))
  check('a compliant scan encodes as PASS', d.verdict, 'PASS')
  check('with no failed rules', d.failedRuleIds, [])
  console.log()
}

/* ───────────────────────────────────────────────── expired product */
{
  const d = decodePayload(encodePayload(scanWith(['MRP_PRESENT'], { expired: true })))
  check('expiry flag survives', d.expired, true)
  console.log()
}

/* ─────────────────────────────────────────────────────────── size */
{
  // Version 10 QR at medium error correction holds 271 bytes of binary data;
  // beyond that the modules get dense enough that phone cameras struggle on
  // a printed page.
  const typical = encodePayload(scanWith(['MRP_PRESENT', 'CUSTOMER_CARE_PRESENT']))
  report('typical payload', `${typical.length} chars`)
  check('a typical report stays under 271 chars', typical.length <= 271, true)

  const worst = encodePayload(scanWith(rulesMeta.ids))
  report('every rule failing', `${worst.length} chars`)
  // Even the pathological case must remain scannable at version 20 (858 bytes).
  check('the worst case stays under 858 chars', worst.length <= 858, true)

  const longName = encodePayload(
    scanWith(['MRP_PRESENT'], { productName: 'X'.repeat(300) }),
  )
  check('a very long product name is truncated', longName.length <= 271, true)
  console.log()
}

/* ───────────────────────────────────────────────── hostile input */
{
  check('plain text is rejected', decodePayload('hello world'), null)
  check('empty string is rejected', decodePayload(''), null)
  check('a URL is rejected', decodePayload('https://example.com'), null)
  check('a wrong prefix is rejected', decodePayload('CMP9:{"v":1}'), null)
  check('malformed JSON is rejected', decodePayload('CMP1:{oops'), null)
  check('a future payload version is rejected', decodePayload('CMP1:{"v":99,"i":"x"}'), null)
  check('a missing id is rejected', decodePayload('CMP1:{"v":1,"d":"V"}'), null)
  check('an invalid verdict is rejected', decodePayload('CMP1:{"v":1,"i":"x","d":"Z"}'), null)
  check('null is rejected', decodePayload('CMP1:null'), null)
  console.log()
}

/* ──────────────────────────── unknown rules from a different build */
{
  const encoded = encodePayload(scanWith(['MRP_PRESENT']))
  // Simulate a code produced by a build whose rules document had more rules.
  const tampered = encoded.replace(/"f":\[\d+\]/, `"f":[${rulesMeta.ids.length + 5}]`)
  const d = decodePayload(tampered)
  check('an unrecognised rule index is surfaced, not dropped', d.failedRuleIds.length, 1)
  check('and is clearly marked unknown', d.failedRuleIds[0].startsWith('UNKNOWN_RULE_'), true)
  console.log()
}

console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
