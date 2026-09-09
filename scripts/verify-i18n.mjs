/**
 * Verifies the translations.
 *
 * The failure this guards against is the one we already shipped once: two
 * complete translation files sitting next to seventeen pages of hardcoded
 * English, so the language toggle did nothing. Key parity alone would not have
 * caught that, so this also checks that the pages actually consume the
 * translations and that no user-visible English is left behind.
 *
 *   node scripts/verify-i18n.mjs
 */
import { readFileSync, readdirSync } from 'node:fs'

let failures = 0
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`)
  if (!ok) console.log(`        expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
}

const en = JSON.parse(readFileSync('src/i18n/en.json', 'utf8'))
const hi = JSON.parse(readFileSync('src/i18n/hi.json', 'utf8'))

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object') flatten(v, `${prefix}${k}.`, out)
    else out[`${prefix}${k}`] = v
  }
  return out
}

const EN = flatten(en)
const HI = flatten(hi)

console.log('Translations\n')

/* ────────────────────────────────────────────────────────── parity */
{
  const missingInHi = Object.keys(EN).filter((k) => !(k in HI))
  const missingInEn = Object.keys(HI).filter((k) => !(k in EN))
  check('every English key has a Hindi translation', missingInHi, [])
  check('no orphan Hindi keys', missingInEn, [])
  console.log(`      ${Object.keys(EN).length} keys in each language`)

  const empty = Object.entries(HI).filter(([, v]) => !String(v).trim())
  check('no Hindi value is blank', empty.map(([k]) => k), [])

  // A Hindi value identical to the English one usually means it was forgotten.
  // Proper nouns and codes are legitimately identical, so allow a short list.
  const ALLOWED_IDENTICAL = new Set([
    'app.name', 'auth.emailPlaceholder', 'nav.scan',
  ])
  const untranslated = Object.keys(EN).filter(
    (k) =>
      !ALLOWED_IDENTICAL.has(k) &&
      EN[k] === HI[k] &&
      // Ignore values that are purely punctuation, numbers or placeholders.
      /[A-Za-z]{4}/.test(String(EN[k])),
  )
  check('no Hindi value is a copy of the English', untranslated, [])
  console.log()
}

/* ───────────────────────────────────────── interpolation integrity */
{
  const bad = []
  for (const k of Object.keys(EN)) {
    const vars = (s) => [...String(s).matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort()
    const a = vars(EN[k])
    const b = vars(HI[k] ?? '')
    if (JSON.stringify(a) !== JSON.stringify(b)) bad.push(k)
  }
  // A missing {{ref}} in Hindi would silently drop the complaint reference.
  check('placeholders match across languages', bad, [])
  console.log()
}

/* ──────────────────────────────────── the pages actually use them */
{
  const pages = readdirSync('src/pages').filter((f) => f.endsWith('.tsx'))
  const notLocalised = pages.filter((f) => {
    const src = readFileSync(`src/pages/${f}`, 'utf8')
    return !src.includes('useTranslation')
  })
  check('every page is localised', notLocalised, [])
  console.log(`      ${pages.length} pages checked`)

  // Keys referenced in code must exist, or the UI renders the raw key.
  const referenced = new Set()
  for (const f of pages) {
    const src = readFileSync(`src/pages/${f}`, 'utf8')
    for (const m of src.matchAll(/\bt\(\s*'([^']+)'/g)) referenced.add(m[1])
  }
  for (const f of readdirSync('src/components').filter((x) => x.endsWith('.tsx'))) {
    const src = readFileSync(`src/components/${f}`, 'utf8')
    for (const m of src.matchAll(/\bt\(\s*'([^']+)'/g)) referenced.add(m[1])
  }

  const dangling = [...referenced].filter((k) => {
    if (k in EN) return false
    // i18next resolves plural keys from a base name.
    return !(`${k}_one` in EN || `${k}_other` in EN)
  })
  check('no page references a missing key', dangling, [])
  console.log(`      ${referenced.size} keys referenced by the UI`)
  console.log()
}

/* ──────────────────── no user-visible English left anywhere in pages */
{
  // Attribute values that carry no prose.
  const NON_PROSE = new Set([
    'class', 'className', 'id', 'type', 'to', 'href', 'src', 'viewBox', 'd',
    'fill', 'stroke', 'strokeWidth', 'strokeLinecap', 'strokeLinejoin', 'name',
    'role', 'rel', 'target', 'inputMode', 'autoComplete', 'method', 'scope',
    'sizes', 'width', 'height', 'xmlns', 'version', 'encoding', 'key', 'as',
    'accept', 'capture', 'rows', 'min', 'max', 'step', 'colSpan',
    'preserveAspectRatio', 'alt',
  ])
  // Two or more real words means prose, not a token.
  const PROSE = /[A-Za-z]{3,}[\s'\u2019][A-Za-z]{3,}/

  const leftovers = []
  for (const f of readdirSync('src/pages').filter((x) => x.endsWith('.tsx'))) {
    const src = readFileSync(`src/pages/${f}`, 'utf8')

    // JSX text nodes: > Some words here <
    for (const m of src.matchAll(/>\s*([A-Za-z][A-Za-z ,'?!.&-]{6,})\s*</g)) {
      const text = m[1].trim()
      if (/^[a-z-]+$/.test(text)) continue // a lone utility/class token
      leftovers.push(`${f}: text "${text}"`)
    }

    // string-literal attributes, e.g. action="All cases"
    for (const m of src.matchAll(/\b([a-zA-Z][a-zA-Z-]*)="([^"]{3,})"/g)) {
      const attr = m[1]
      const value = m[2]
      if (NON_PROSE.has(attr)) continue
      if (PROSE.test(value)) leftovers.push(`${f}: ${attr}="${value}"`)
    }
  }
  check('no hardcoded English prose remains in pages', leftovers, [])
}

/* ────────────────────────────────────────── Devanagari sanity check */
{
  // Guard against a mojibake'd file, which would render as boxes on a phone.
  const hindiValues = Object.entries(HI).filter(([k]) => !/Placeholder$/.test(k))
  const withDevanagari = hindiValues.filter(([, v]) => /[\u0900-\u097F]/.test(String(v)))
  const ratio = withDevanagari.length / hindiValues.length
  check('most Hindi values contain Devanagari', ratio > 0.85, true)
  console.log(`      ${withDevanagari.length}/${hindiValues.length} values in Devanagari`)
  console.log()
}

console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
