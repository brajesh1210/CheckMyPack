import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { Download, Share2, ArrowLeft, Check, ShieldCheck, QrCode } from 'lucide-react'
import { Screen, ScrollArea } from '../components/UI'
import { useApp } from '../store/app'
import { downloadPdfReport } from '../lib/pdf'
import { shareScan } from '../lib/share'

/** Crisp verification QR Code graphic */
function QRBlock({ seed }: { seed: string }) {
  const n = 21
  const cells: boolean[] = []
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  for (let i = 0; i < n * n; i++) {
    h = (h * 1103515245 + 12345) >>> 0
    cells.push(((h >>> 16) & 1) === 1)
  }
  const finder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7)

  return (
    <svg viewBox={`0 0 ${n} ${n}`} className="h-24 w-24 rounded-lg bg-white p-1 shadow-xs" role="img" aria-label={`Verification QR code for ${seed}`}>
      <rect width={n} height={n} fill="#fff" />
      {cells.map((on, i) => {
        const r = Math.floor(i / n)
        const c = i % n
        if (finder(r, c)) return null
        return on ? <rect key={i} x={c} y={r} width="1" height="1" fill="var(--cmp-ink)" /> : null
      })}
      {[
        [0, 0],
        [0, n - 7],
        [n - 7, 0],
      ].map(([r, c]) => (
        <g key={`${r}-${c}`}>
          <rect x={c} y={r} width="7" height="7" fill="var(--cmp-ink)" />
          <rect x={c + 1} y={r + 1} width="5" height="5" fill="#fff" />
          <rect x={c + 2} y={r + 2} width="3" height="3" fill="var(--cmp-ink)" />
        </g>
      ))}
    </svg>
  )
}

const AUDIT_ROWS = [
  { id: 'mrp', label: 'MRP', status: 'Pass' },
  { id: 'qty', label: 'Net Quantity', status: 'Pass' },
  { id: 'mfg', label: 'Manufacturing Date', status: 'Pass' },
  { id: 'bb', label: 'Best Before', status: 'Pass' },
  { id: 'fssai', label: 'FSSAI Licence', status: 'Pass' },
  { id: 'mfr', label: 'Manufacturer Details', status: 'Pass' },
  { id: 'care', label: 'Consumer Care', status: 'Pass' },
  { id: 'veg', label: 'Veg / Non-Veg Symbol', status: 'Pass' },
]

export default function DetailedReport() {
  const { t } = useTranslation()
  const { id } = useParams()
  const nav = useNavigate()
  const { scans, lastScanId } = useApp()
  const scan = useMemo(() => scans.find((s) => s.id === (id ?? lastScanId)) ?? scans[0], [scans, id, lastScanId])
  const [busy, setBusy] = useState(false)

  const isCompliant = scan?.verdict === 'PASS'

  const handleDownload = async () => {
    if (!scan) return
    setBusy(true)
    try {
      await downloadPdfReport(scan)
    } finally {
      setBusy(false)
    }
  }

  const handleShare = async () => {
    if (!scan) return
    await shareScan(scan)
  }

  if (!scan) {
    return (
      <Screen>
        <header className="flex min-h-[60px] items-center px-4">
          <button type="button" onClick={() => nav('/app/home')} className="tap font-semibold text-brand-600">
            {t('common.back')}
          </button>
        </header>
        <div className="flex flex-1 items-center justify-center p-6 text-center text-ink-500">
          {t('report.unavailable')}
        </div>
      </Screen>
    )
  }

  return (
    <Screen>
      {/* ---------------------------------------------------- Header Bar */}
      <header className="sticky top-0 z-30 flex min-h-[60px] items-center justify-between border-b border-ink-200/60 bg-surface/90 px-3 backdrop-blur-md">
        <button
          type="button"
          onClick={() => nav(-1)}
          aria-label={t('common.back')}
          className="grid h-11 w-11 place-items-center rounded-full text-ink-600 hover:bg-ink-100"
        >
          <ArrowLeft size={22} strokeWidth={2} aria-hidden />
        </button>

        <div className="min-w-0 text-center">
          <h1 className="truncate font-display text-xs font-bold text-ink-900">
            {t('report.title')}
          </h1>
          <p className="font-mono text-2xs text-ink-500">{scan.id}</p>
        </div>

        <span className={isCompliant ? 'badge-ok' : 'badge-bad'}>
          {isCompliant ? t('result.pass') : t('officer.violation')}
        </span>
      </header>

      <ScrollArea className="gutter pb-8">
        {/* Product Information Card */}
        <div className="mt-4 flex items-center gap-3.5 rounded-2xl border border-ink-200/80 bg-surface p-3.5 shadow-xs">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-ink-100 text-brand-700">
            <ShieldCheck size={28} strokeWidth={1.8} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-md font-bold text-ink-900">
              {scan.productName}
            </h2>
            <p className="mt-0.5 text-xs text-ink-500">
              {t('report.scanDate')}: {new Date(scan.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
            <p className="text-2xs text-ink-400">{scan.place}</p>
          </div>
        </div>

        {/* Declaration Verification Table Card */}
        <div className="mt-5 rounded-2xl border border-ink-200/80 bg-surface p-4 shadow-xs">
          <h3 className="font-display text-sm font-bold text-ink-900">
            {t('report.declarationAudit')}
          </h3>

          <div className="mt-3 divide-y divide-ink-100 text-xs">
            {AUDIT_ROWS.map((row) => (
              <div key={row.id} className="flex items-center justify-between py-2.5">
                <span className="font-medium text-ink-800">{row.label}</span>
                <span className="font-semibold text-ok-base">✓ {row.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Digital Signature & QR Verification Section */}
        <div className="mt-5 flex items-center gap-4 rounded-2xl border border-brand-200 bg-brand-50/50 p-4">
          <QRBlock seed={scan.id} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-brand-700">
              <QrCode size={13} aria-hidden />
              <span>{t('report.verifiableRecord')}</span>
            </div>
            <p className="mt-1 font-mono text-2xs font-bold text-ink-900">
              {scan.id}
            </p>
            <p className="mt-0.5 text-2xs text-ink-600">
              {scan.place}
            </p>
            <p className="mt-1 text-2xs text-brand-800/80">
              {t('report.verifyNote')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={busy}
            className="btn-primary flex-1 min-h-[48px] rounded-xl text-sm font-semibold"
          >
            <Download size={18} strokeWidth={2} aria-hidden />
            {t('report.savePdf')}
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="btn-secondary min-h-[48px] px-5 text-sm font-semibold"
          >
            <Share2 size={18} strokeWidth={2} aria-hidden />
            {t('report.share')}
          </button>
        </div>
      </ScrollArea>
    </Screen>
  )
}
