/**
 * Report PDF.
 *
 * This is the artefact a consumer attaches to a complaint, so it has to stand
 * on its own: the annotated photograph, the verdict, every finding with the
 * statute it comes from, and a QR code that lets anyone re-check the result
 * without internet.
 *
 * Everything is generated on-device. No server is involved, so a report can be
 * produced in a shop with no signal.
 */

import type { StoredScan } from '../store/app'
import { encodePayload } from './verifyCode'

const A4 = { w: 210, h: 297 } // mm
const M = 16 // page margin

// Print-safe equivalents of the app's semantic colours.
const INK = [26, 32, 28] as const
const MUTED = [110, 118, 112] as const
const RULE = [214, 219, 215] as const
const PASS = [46, 125, 50] as const
const FAIL = [198, 40, 40] as const
const WARN = [178, 107, 0] as const

type Doc = import('jspdf').jsPDF

type Rgb = readonly [number, number, number]

function severityColour(sev: string): Rgb {
  return sev === 'critical' ? FAIL : sev === 'major' ? WARN : MUTED
}

/**
 * Draws the label photo with a numbered box over each failed declaration, so
 * a reader can connect an item in the checklist to a place on the pack.
 */
async function drawAnnotatedImage(
  doc: Doc,
  scan: StoredScan,
  x: number,
  y: number,
  maxW: number,
  maxH: number,
): Promise<number> {
  const img = new Image()
  img.src = scan.imageDataUrl
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('image failed to load'))
      // A corrupt data URL must not hang report generation.
      setTimeout(() => reject(new Error('image timed out')), 5000)
    })
  } catch {
    return 0
  }

  const ratio = img.naturalHeight / img.naturalWidth || 1
  let w = maxW
  let h = w * ratio
  if (h > maxH) {
    h = maxH
    w = h / ratio
  }

  doc.addImage(scan.imageDataUrl, 'JPEG', x, y, w, h, undefined, 'FAST')
  doc.setDrawColor(...RULE)
  doc.setLineWidth(0.2)
  doc.rect(x, y, w, h)

  // Boxes are normalised 0..1 against the original image.
  const boxed = scan.findings.filter((f) => !f.passed && f.box)
  boxed.forEach((f, i) => {
    const b = f.box!
    const bx = x + b.x * w
    const by = y + b.y * h
    const bw = b.w * w
    const bh = b.h * h

    doc.setDrawColor(...FAIL)
    doc.setLineWidth(0.5)
    doc.rect(bx, by, bw, bh)

    // Numbered tag, keyed to the checklist below.
    const tag = String(i + 1)
    doc.setFillColor(...FAIL)
    doc.circle(bx, by, 2.4, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text(tag, bx, by + 0.9, { align: 'center' })
  })

  return h
}

export interface PdfOptions {
  /** Where the scan happened, printed on the report. */
  place?: string
  /** Reporter's name, when they are signed in. */
  reporter?: string
}

export async function buildReportPdf(
  scan: StoredScan,
  opts: PdfOptions = {},
): Promise<Blob> {
  const [{ jsPDF }, QR] = await Promise.all([import('jspdf'), import('qrcode')])

  const doc: Doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  let y = M

  /* ─────────────────────────────────────────────────────── header */

  doc.setFillColor(...PASS)
  doc.rect(0, 0, A4.w, 3, 'F')

  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('CheckMyPack', M, y + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  doc.text('Packaged commodity label compliance report', M, y + 11)

  doc.setFontSize(8)
  doc.text(`Report ${scan.id}`, A4.w - M, y + 6, { align: 'right' })
  doc.text(
    new Date(scan.createdAt).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
    A4.w - M,
    y + 10,
    { align: 'right' },
  )

  y += 18
  doc.setDrawColor(...RULE)
  doc.setLineWidth(0.3)
  doc.line(M, y, A4.w - M, y)
  y += 8

  /* ──────────────────────────────────────────────── verdict banner */

  const isViolation = scan.verdict === 'VIOLATION'
  const band: Rgb = isViolation ? FAIL : PASS
  const bandH = 16

  doc.setFillColor(...band)
  doc.rect(M, y, A4.w - 2 * M, bandH, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(
    isViolation ? 'NON-COMPLIANT LABEL' : 'LABEL APPEARS COMPLIANT',
    M + 4,
    y + 10,
  )
  doc.setFontSize(10)
  doc.text(`Grade ${scan.grade}  ·  ${scan.score}/100`, A4.w - M - 4, y + 10, {
    align: 'right',
  })
  y += bandH

  // An expired product is the single most urgent thing on the page.
  if (scan.expired) {
    doc.setFillColor(...FAIL)
    doc.rect(M, y, A4.w - 2 * M, 9, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.text('EXPIRED PRODUCT — DO NOT CONSUME', M + 4, y + 6)
    y += 9
  }
  y += 8

  /* ─────────────────────────────────────────── product + evidence */

  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(scan.productName, M, y)
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  const meta = [
    scan.barcode ? `Barcode ${scan.barcode}` : null,
    opts.place ?? scan.place,
    opts.reporter ? `Reported by ${opts.reporter}` : null,
  ]
    .filter(Boolean)
    .join('   ·   ')
  doc.text(meta, M, y)
  y += 8

  const imgH = await drawAnnotatedImage(doc, scan, M, y, 78, 62)

  /* ───────────────────────────────────────────────── QR, alongside */

  const qrData = encodePayload(scan)
  const qrPng = await QR.toDataURL(qrData, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 512,
  })

  const qrX = A4.w - M - 38
  doc.addImage(qrPng, 'PNG', qrX, y, 38, 38)
  doc.setFontSize(7.5)
  doc.setTextColor(...MUTED)
  doc.text('Scan to verify this report.', qrX + 19, y + 42, { align: 'center' })
  doc.text('Works offline — the findings', qrX + 19, y + 45.5, { align: 'center' })
  doc.text('are inside the code itself.', qrX + 19, y + 49, { align: 'center' })

  y += Math.max(imgH, 52) + 10

  /* ───────────────────────────────────────────────────── checklist */

  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Findings', M, y)
  y += 2
  doc.setDrawColor(...RULE)
  doc.line(M, y, A4.w - M, y)
  y += 6

  const failed = scan.findings.filter((f) => !f.passed)
  const passed = scan.findings.filter((f) => f.passed)
  const boxedIds = failed.filter((f) => f.box).map((f) => f.id)

  const newPageIfNeeded = (need: number) => {
    if (y + need > A4.h - 22) {
      doc.addPage()
      y = M
    }
  }

  for (const f of failed) {
    newPageIfNeeded(24)

    const tagIdx = boxedIds.indexOf(f.id)
    const label = tagIdx >= 0 ? `${tagIdx + 1}. ${f.label}` : f.label

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(...severityColour(f.severity))
    doc.text(label, M, y)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.text(f.severity.toUpperCase(), A4.w - M, y, { align: 'right' })
    y += 4.5

    doc.setTextColor(...INK)
    doc.setFontSize(8.5)
    const msg = doc.splitTextToSize(f.message, A4.w - 2 * M)
    doc.text(msg, M, y)
    y += msg.length * 3.8 + 1

    doc.setTextColor(...MUTED)
    doc.setFontSize(8)
    const cite = doc.splitTextToSize(`Statute: ${f.statute}`, A4.w - 2 * M)
    doc.text(cite, M, y)
    y += cite.length * 3.6

    if (f.guidance) {
      const g = doc.splitTextToSize(`What to do: ${f.guidance}`, A4.w - 2 * M)
      doc.text(g, M, y)
      y += g.length * 3.6
    }
    y += 4
  }

  if (failed.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...PASS)
    doc.text('No violations were detected against the rules applied below.', M, y)
    y += 8
  }

  /* ─────────────────────────────────────────────── checks that passed */

  if (passed.length) {
    newPageIfNeeded(20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...INK)
    doc.text(`Checks passed (${passed.length})`, M, y)
    y += 5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    const names = doc.splitTextToSize(
      passed.map((p) => p.label).join('  ·  '),
      A4.w - 2 * M,
    )
    doc.text(names, M, y)
    y += names.length * 3.4 + 6
  }

  /* ──────────────────────────────────────────────────────── footer */

  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setDrawColor(...RULE)
    doc.setLineWidth(0.3)
    doc.line(M, A4.h - 16, A4.w - M, A4.h - 16)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...MUTED)
    // The honest disclaimer: this is an automated reading, not an adjudication.
    doc.text(
      'Generated by CheckMyPack from an automated reading of the label. ' +
        'It is an aid to inspection, not a legal determination. ' +
        'Verify against the packet before acting.',
      M,
      A4.h - 11,
      { maxWidth: A4.w - 2 * M - 20 },
    )
    doc.text(`${i} / ${pages}`, A4.w - M, A4.h - 11, { align: 'right' })
  }

  return doc.output('blob')
}

/** Filename used for downloads and shares. */
export function reportFilename(scan: StoredScan): string {
  return `CheckMyPack-${scan.id}.pdf`
}
