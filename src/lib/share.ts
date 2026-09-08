/** Share a verdict via the Web Share API, WhatsApp, or the clipboard. */

import type { StoredScan } from '../store/app'
import { nativeShare } from './native'

export function scanSummary(scan: StoredScan): string {
  const violations = scan.findings.filter((f) => !f.passed)
  const lines = [
    `CheckMyPack report — ${scan.productName}`,
    `Verdict: ${scan.verdict === 'PASS' ? 'Compliant' : scan.verdict === 'VIOLATION' ? 'Violation found' : 'Retake needed'} (Grade ${scan.grade})`,
    `Reference: ${scan.id}`,
    `Scanned: ${new Date(scan.createdAt).toLocaleString('en-IN')}`,
  ]
  if (scan.expired) lines.push('WARNING: product is past its expiry date.')
  if (violations.length) {
    lines.push('', 'Violations:')
    violations.forEach((v, i) => lines.push(`${i + 1}. ${v.label} — ${v.statute}`))
  }
  lines.push('', 'Checked against LMPC 2011 and FSSAI labelling rules.')
  return lines.join('\n')
}

export async function shareScan(scan: StoredScan) {
  const text = scanSummary(scan)
  // Native share sheet first (Android), then the web equivalent.
  if (await nativeShare('CheckMyPack report', text)) return
  if (navigator.share) {
    try {
      await navigator.share({ title: 'CheckMyPack report', text })
      return
    } catch {
      /* user dismissed */
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    alert('Report copied to the clipboard.')
  } catch {
    window.prompt('Copy this report:', text)
  }
}

export function whatsappUrl(scan: StoredScan) {
  return `https://wa.me/?text=${encodeURIComponent(scanSummary(scan))}`
}
