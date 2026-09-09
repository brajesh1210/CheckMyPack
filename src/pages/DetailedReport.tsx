import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { Download, Share2, Scale, FileText } from 'lucide-react'
import { Screen, ScrollArea, AppBar, StatusPill, EmptyState } from '../components/UI'
import { Mark } from '../components/Brand'
import { useApp } from '../store/app'

/** Deterministic pseudo-QR: same id always renders the same pattern. */
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
    <svg viewBox={`0 0 ${n} ${n}`} className="h-28 w-28" role="img" aria-label={`Verification QR code for ${seed}`}>
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

export default function DetailedReport() {
  const { t } = useTranslation()
  const { id } = useParams()
  const nav = useNavigate()
  const { scans, lastScanId } = useApp()
  const scan = scans.find((s) => s.id === (id ?? lastScanId))

  if (!scan) {
    return (
      <Screen>
        <AppBar back title={t('result.detailedReport')} />
        <EmptyState icon={FileText} title={t('report.unavailable')} body={t('report.unavailableBody')}
          action={<button type="button" onClick={() => nav('/app/home')} className="btn-primary btn-sm">{t('report.goHome')}</button>} />
      </Screen>
    )
  }

  const violations = scan.findings.filter((f) => !f.passed)

  return (
    <Screen>
      <AppBar back title={t('result.detailedReport')} subtitle={scan.id} />

      <ScrollArea className="pb-6">
        {/* -------------------------------------------------------- letterhead */}
        <div className="gutter border-b border-ink-200 bg-surface py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Mark size={30} className="text-brand-500" />
              <div>
                <p className="font-display text-md font-semibold leading-tight">{t('app.name')}</p>
                <p className="text-2xs text-ink-500">{t('report.heading')}</p>
              </div>
            </div>
            <StatusPill state={scan.verdict} />
          </div>
        </div>

        {/* ------------------------------------------------------------ meta */}
        <div className="gutter pt-5">
          <dl className="card divide-y divide-ink-200 overflow-hidden">
            {[
              ['Report ID', scan.id],
              ['Product', scan.productName],
              ['Scanned on', new Date(scan.createdAt).toLocaleString('en-IN')],
              ['Location', scan.place],
              [t('report.complianceGrade'), `Grade ${scan.grade}`],
              ['Rule set', 'LMPC 2011 · FSSAI · GSR 881(E)'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline gap-4 px-4 py-3">
                <dt className="w-[38%] shrink-0 text-xs font-medium uppercase tracking-[0.05em] text-ink-500">{k}</dt>
                <dd className="min-w-0 flex-1 text-sm font-medium text-ink-900 tnum">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ---------------------------------------------------- declarations */}
        <section className="gutter pt-7">
          <h2 className="font-display text-md font-semibold">{t('report.declarationAudit')}</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-ink-200">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-ink-50 text-2xs uppercase tracking-[0.06em] text-ink-500">
                  <th scope="col" className="px-3.5 py-2.5 font-semibold">{t('report.declaration')}</th>
                  <th scope="col" className="px-3.5 py-2.5 font-semibold">{t('report.value')}</th>
                  <th scope="col" className="px-3.5 py-2.5 text-right font-semibold">{t('landing.step3')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200 bg-surface">
                {scan.findings.map((it) => (
                  <tr key={it.id}>
                    <th scope="row" className="px-3.5 py-2.5 font-medium text-ink-800">{it.label}</th>
                    <td className="px-3.5 py-2.5 text-ink-600 tnum">{it.value ?? '—'}</td>
                    <td className="px-3.5 py-2.5 text-right">
                      <span className={it.passed ? 'badge-ok' : 'badge-bad'}>
                        {it.passed ? 'Pass' : 'Fail'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* --------------------------------------------------------- statute */}
        {violations.length > 0 && (
          <section className="gutter pt-7">
            <h2 className="font-display text-md font-semibold">{t('report.statutory')}</h2>
            <ul className="mt-3 space-y-2">
              {violations.map((i) => (
                <li key={i.id} className="card flex gap-3 p-3.5">
                  <Scale size={16} className="mt-0.5 shrink-0 text-ink-400" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900">{i.statute}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-ink-500">{i.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* -------------------------------------------------------- verify QR */}
        <section className="gutter pt-7">
          <div className="card flex items-center gap-4 p-4">
            <div className="shrink-0 rounded-lg border border-ink-200 p-1.5">
              <QRBlock seed={scan.id} />
            </div>
            <div className="min-w-0">
              <h2 className="text-md font-semibold text-ink-900">{t('report.verifyTitle')}</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-500">
                {t('report.verifyNote')}
              </p>
            </div>
          </div>
        </section>

        <p className="gutter pt-5 text-xs leading-relaxed text-ink-400">
          This report is generated by an automated advisory tool and does not itself constitute a
          legal finding. Enforcement action rests with the competent Legal Metrology authority.
        </p>
      </ScrollArea>

      <div className="safe-b gutter flex gap-2.5 border-t border-ink-200 bg-surface py-3.5">
        <button type="button" className="btn-secondary flex-1">
          <Share2 size={17} strokeWidth={2} aria-hidden />
          {t('report.share')}
        </button>
        <button type="button" onClick={() => window.print()} className="btn-primary flex-1">
          <Download size={17} strokeWidth={2} aria-hidden />
          {t('report.savePdf')}
        </button>
      </div>
    </Screen>
  )
}
