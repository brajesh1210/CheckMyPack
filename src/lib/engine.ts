/**
 * Deterministic compliance engine.
 *
 * Consumes structured fields (from OCR/vision) and rules.json, and returns a
 * verdict. No model is consulted here — identical input always yields an
 * identical, citable outcome.
 */

import rulesDoc from './rules.json'
import type { Fields } from './extract'

export type Severity = 'critical' | 'major' | 'minor'
export type Verdict = 'PASS' | 'VIOLATION' | 'RETAKE'
export type Grade = 'A' | 'B' | 'C'

export interface Finding {
  id: string
  field: string
  label: string
  severity: Severity
  statute: string
  message: string
  guidance: string
  passed: boolean
  value: string | null
  confidence: number
  box?: { x: number; y: number; w: number; h: number }
}

export interface EngineResult {
  verdict: Verdict
  grade: Grade
  findings: Finding[]
  violations: Finding[]
  passes: Finding[]
  expired: boolean
  category: string | null
  score: number
  rulesVersion: string
  amendments: { name: string; notification: string; effective: string; summary: string }[]
}

interface RuleTest {
  op: string
  pattern?: string
  ref?: string
  fields?: string[]
  category?: string
}
interface Rule {
  id: string
  field: string
  severity: Severity
  statute: string
  test: RuleTest
  message: string
  guidance: string
  extract?: string
}

const doc = rulesDoc as unknown as {
  schemaVersion: string
  amendments: EngineResult['amendments']
  fieldDefinitions: Record<string, { label: string; mandatory: boolean; source: string }>
  rules: Rule[]
}

export const CONFIDENCE_FLOOR = 0.55

/** JS RegExp has no inline (?i); strip it and use the flag instead. */
function toRegExp(pattern: string): RegExp {
  const ci = pattern.startsWith('(?i)')
  return new RegExp(ci ? pattern.slice(4) : pattern, ci ? 'i' : '')
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

/** Parse the loose date formats found on Indian packaging. */
export function parseLabelDate(raw: string | null): Date | null {
  if (!raw) return null
  const s = raw.toLowerCase().trim()

  // 03/2026 or 03-2026
  let m = s.match(/^([01]?[0-9])[/\-.]((?:20)?[0-9]{2})$/)
  if (m) {
    const mo = parseInt(m[1], 10) - 1
    const yr = m[2].length === 2 ? 2000 + parseInt(m[2], 10) : parseInt(m[2], 10)
    if (mo >= 0 && mo <= 11) return new Date(yr, mo + 1, 0)
  }

  // 12/03/2026
  m = s.match(/^([0-3]?[0-9])[/\-.]([01]?[0-9])[/\-.]((?:20)?[0-9]{2})$/)
  if (m) {
    const yr = m[3].length === 2 ? 2000 + parseInt(m[3], 10) : parseInt(m[3], 10)
    return new Date(yr, parseInt(m[2], 10) - 1, parseInt(m[1], 10))
  }

  // mar 2026 / march 2026
  m = s.match(/^([a-z]{3})[a-z]*[ /\-.]+((?:20)?[0-9]{2})$/)
  if (m && m[1] in MONTHS) {
    const yr = m[2].length === 2 ? 2000 + parseInt(m[2], 10) : parseInt(m[2], 10)
    return new Date(yr, MONTHS[m[1]] + 1, 0)
  }

  return null
}

/** Rules whose wording appears elsewhere on the pack, not inside the field value. */
const TEXT_SCOPED = new Set(['MRP_INCLUSIVE_OF_TAXES'])

function evaluate(
  rule: Rule,
  fields: Fields,
  category: string | null,
  fullText: string,
): { passed: boolean; skipped: boolean } {
  const f = fields[rule.field]
  const value = f?.value ?? null
  const t = rule.test

  switch (t.op) {
    case 'required':
      return { passed: !!value, skipped: false }

    case 'regex': {
      // Only meaningful if the field was found at all.
      if (!value) return { passed: false, skipped: false }
      const re = toRegExp(t.pattern!)
      // Some declarations are worded next to the value rather than inside it.
      const haystack = TEXT_SCOPED.has(rule.id) ? `${value}\n${fullText}` : value
      return { passed: re.test(haystack), skipped: false }
    }

    case 'regex_if_present':
      if (!value) return { passed: true, skipped: true }
      return { passed: toRegExp(t.pattern!).test(value), skipped: false }

    case 'any_of':
      return {
        passed: (t.fields ?? []).some((k) => !!fields[k]?.value) || !!value,
        skipped: false,
      }

    case 'date_not_past': {
      const d = parseLabelDate(value)
      if (!d) return { passed: true, skipped: true }
      return { passed: d.getTime() >= Date.now(), skipped: false }
    }

    case 'required_if_category':
      if (category !== t.category) return { passed: true, skipped: true }
      return { passed: !!value, skipped: false }

    case 'mrp_sticker_check':
      // Cannot be judged from text alone; needs a print-vs-sticker signal.
      return { passed: true, skipped: true }

    case 'numeral_height':
      // Fourth Schedule height check needs physical calibration.
      return { passed: true, skipped: true }

    default:
      return { passed: true, skipped: true }
  }
}

export function runEngine(
  fields: Fields,
  category: string | null,
  opts: { unreliable?: boolean; fullText?: string } = {},
): EngineResult {
  // An unreadable capture yields no findings at all — the engine refuses to
  // judge a label it could not read, rather than reporting everything missing.
  if (opts.unreliable) {
    return {
      verdict: 'RETAKE',
      grade: 'B',
      findings: [],
      violations: [],
      passes: [],
      expired: false,
      category,
      score: 0,
      rulesVersion: doc.schemaVersion,
      amendments: doc.amendments,
    }
  }

  const fullText = opts.fullText ?? ''
  const findings: Finding[] = []

  for (const rule of doc.rules) {
    const { passed, skipped } = evaluate(rule, fields, category, fullText)
    if (skipped) continue

    const f = fields[rule.field]
    findings.push({
      id: rule.id,
      field: rule.field,
      label: doc.fieldDefinitions[rule.field]?.label ?? rule.field,
      severity: rule.severity,
      statute: rule.statute,
      message: rule.message,
      guidance: rule.guidance,
      passed,
      value: f?.value ?? null,
      confidence: f?.confidence ?? 0,
      box: f?.box,
    })
  }

  const violations = findings.filter((f) => !f.passed)
  const passes = findings.filter((f) => f.passed)
  const critical = violations.filter((v) => v.severity === 'critical')
  const major = violations.filter((v) => v.severity === 'major')

  const expiryDate = parseLabelDate(fields.expiry?.value ?? null)
  const expired = !!expiryDate && expiryDate.getTime() < Date.now()

  let verdict: Verdict
  let grade: Grade

  if (critical.length > 0) {
    verdict = 'VIOLATION'
    grade = 'C'
  } else if (major.length > 0) {
    verdict = 'VIOLATION'
    grade = 'B'
  } else {
    verdict = 'PASS'
    grade = 'A'
  }

  const score = findings.length ? Math.round((passes.length / findings.length) * 100) : 0

  return {
    verdict,
    grade,
    findings,
    violations,
    passes,
    expired,
    category,
    score,
    rulesVersion: doc.schemaVersion,
    amendments: doc.amendments,
  }
}

export const rulesMeta = {
  version: doc.schemaVersion,
  ruleCount: doc.rules.length,
  amendments: doc.amendments,
  fieldDefinitions: doc.fieldDefinitions,
}
