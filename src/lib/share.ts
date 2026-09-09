/** Share a verdict via the Web Share API, WhatsApp, or the clipboard. */

import type { StoredScan } from '../store/app'
import { nativeShare, shareBinaryFile } from './native'
import { buildReportPdf, reportFilename } from './pdf'

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

/**
 * Builds the report PDF and hands it to the platform: the Android share sheet
 * when running natively, the Web Share API when the browser supports sharing
 * files, and a plain download otherwise.
 *
 * Generation happens on-device, so this works with no connectivity.
 */
export async function shareReportPdf(
  scan: StoredScan,
  opts: { place?: string; reporter?: string } = {},
): Promise<'shared' | 'downloaded' | 'failed'> {
  let blob: Blob
  try {
    blob = await buildReportPdf(scan, opts)
  } catch {
    return 'failed'
  }

  const filename = reportFilename(scan)

  if (await shareBinaryFile(filename, blob, 'CheckMyPack report')) return 'shared'

  // Web Share with a file attachment, where available.
  try {
    const file = new File([blob], filename, { type: 'application/pdf' })
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'CheckMyPack report' })
      return 'shared'
    }
  } catch {
    // Dismissed or unsupported — fall through to a download.
  }

  try {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    // Revoking immediately can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
    return 'downloaded'
  } catch {
    return 'failed'
  }
}

/** Returns the PDF as a blob without sharing it, for preview or attachment. */
export async function reportPdfBlob(
  scan: StoredScan,
  opts: { place?: string; reporter?: string } = {},
): Promise<Blob | null> {
  try {
    return await buildReportPdf(scan, opts)
  } catch {
    return null
  }
}
