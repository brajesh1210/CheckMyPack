/**
 * The verification payload carried inside the QR code on every report.
 *
 * Design choice: the QR carries the findings themselves, not a link. An
 * inspector at a shop counter, or a judge at a demo table, can verify a report
 * with no internet and no server running. A URL would be smaller but dead the
 * moment connectivity or the backend is unavailable — which is exactly when a
 * paper report matters most.
 *
 * The trade-off is size, so the payload is aggressively abbreviated: short
 * keys, rule ids reduced to indices into the rules document, and dates stored
 * as compact strings. A typical report encodes to roughly 200-300 characters,
 * well inside a version-10 QR at medium error correction.
 */

import type { StoredScan } from '../store/app'
import { rulesMeta } from './engine'

/** Bumped if the payload shape changes, so old codes stay readable. */
export const PAYLOAD_VERSION = 1

export interface VerifyPayload {
  /** Payload version. */
  v: number
  /** Scan id, e.g. CMP-1234-5678. */
  i: string
  /** Scanned at, as YYYYMMDDHHmm in UTC. */
  t: string
  /** Verdict: P = pass, V = violation. */
  d: 'P' | 'V'
  /** Grade. */
  g: string
  /** Score out of 100. */
  s: number
  /** Expired product. */
  x: 0 | 1
  /** Rules document version, so a verifier knows which text was applied. */
  r: string
  /** Product name, truncated. */
  n: string
  /** Indices of the rules that FAILED, into rulesMeta.ids. */
  f: number[]
}

function compactTime(iso: string): string {
  const d = new Date(iso)
  const p = (n: number, w = 2) => String(n).padStart(w, '0')
  return (
    `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `${p(d.getUTCHours())}${p(d.getUTCMinutes())}`
  )
}

function expandTime(t: string): string {
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(t)
  if (!m) return ''
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00.000Z`
}

/** All known rule ids, in a stable order, used as the index table. */
function ruleIds(): string[] {
  return rulesMeta.ids
}

export function buildPayload(scan: StoredScan): VerifyPayload {
  const ids = ruleIds()
  return {
    v: PAYLOAD_VERSION,
    i: scan.id,
    t: compactTime(scan.createdAt),
    d: scan.verdict === 'VIOLATION' ? 'V' : 'P',
    g: scan.grade,
    s: scan.score,
    x: scan.expired ? 1 : 0,
    r: rulesMeta.version,
    n: scan.productName.slice(0, 40),
    f: scan.findings
      .filter((f) => !f.passed)
      .map((f) => ids.indexOf(f.id))
      .filter((i) => i >= 0),
  }
}

/** The string that actually goes into the QR image. */
export function encodePayload(scan: StoredScan): string {
  return `CMP1:${JSON.stringify(buildPayload(scan))}`
}

export interface DecodedReport {
  id: string
  scannedAt: string
  verdict: 'PASS' | 'VIOLATION'
  grade: string
  score: number
  expired: boolean
  rulesVersion: string
  productName: string
  failedRuleIds: string[]
  /** True when the code was produced against a different rules document. */
  rulesVersionMismatch: boolean
}

/**
 * Reads a scanned QR string back into a human-checkable report. Returns null
 * for anything that is not one of our codes, rather than throwing.
 */
export function decodePayload(raw: string): DecodedReport | null {
  if (!raw.startsWith('CMP1:')) return null

  let p: VerifyPayload
  try {
    p = JSON.parse(raw.slice(5)) as VerifyPayload
  } catch {
    return null
  }

  if (typeof p !== 'object' || p === null || p.v !== PAYLOAD_VERSION) return null
  if (typeof p.i !== 'string' || (p.d !== 'P' && p.d !== 'V')) return null

  const ids = ruleIds()
  return {
    id: p.i,
    scannedAt: expandTime(p.t ?? ''),
    verdict: p.d === 'V' ? 'VIOLATION' : 'PASS',
    grade: p.g ?? '',
    score: typeof p.s === 'number' ? p.s : 0,
    expired: p.x === 1,
    rulesVersion: p.r ?? '',
    productName: p.n ?? '',
    // An index we do not recognise means the code came from a build with a
    // different rules document; surface it rather than silently dropping it.
    failedRuleIds: (p.f ?? []).map((i) => ids[i] ?? `UNKNOWN_RULE_${i}`),
    rulesVersionMismatch: p.r !== rulesMeta.version,
  }
}
