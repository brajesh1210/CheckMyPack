import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ShieldCheck, TriangleAlert, Check, X, Volume2, Square, Share2, FileText, ChevronRight,
  Scale, RotateCcw, CalendarX, Barcode, WifiOff,
  FileDown,
} from 'lucide-react'
import { Screen, ScrollArea, AppBar, EmptyState } from '../components/UI'
import { useApp } from '../store/app'
import { speak, stopSpeaking, speechSupported, verdictScript } from '../lib/speech'
import { shareScan, shareReportPdf } from '../lib/share'

export default function Result() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { id } = useParams()
  const { scans, lastScanId, lang, voice, online } = useApp()
  const scan = useMemo(() => scans.find((s) => s.id === (id ?? lastScanId)), [scans, id, lastScanId])
  const [focused, setFocused] = useState<string | null>(null)
  const [speaking, setSpeaking] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)

  const violations = scan?.findings.filter((f) => !f.passed) ?? []
  const bad = scan?.verdict === 'VIOLATION'

  const script = scan
    ? verdictScript(lang, {
        productName: scan.productName,
        verdict: scan.verdict,
        grade: scan.grade,
        violationCount: violations.length,
        expired: scan.expired,
      })
    : ''

  // Announce the verdict once, if the user has voice enabled.
  useEffect(() => {
    if (!scan || !voice || !speechSupported()) return
    const t = setTimeout(() => {
      setSpeaking(true)
      speak(script, lang, () => setSpeaking(false))
    }, 450)
    return () => {
      clearTimeout(t)
      stopSpeaking()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scan?.id])

  const toggleSpeak = () => {
    if (speaking) {
      stopSpeaking()
      setSpeaking(false)
    } else {
      setSpeaking(true)
      speak(script, lang, () => setSpeaking(false))
    }
  }

  if (!scan) {
    return (
      <Screen>
        <AppBar back title={t('result.title')} />
        <EmptyState
          icon={FileText}
          title={t('result.none')}
          body={t('result.noneBody')}
          action={
            <button type="button" onClick={() => nav('/app/scan')} className="btn-primary btn-sm">
              {t('result.scanAPack')}
            </button>
          }
        />
      </Screen>
    )
  }

  const boxed = scan.findings.filter((f) => f.box)

  return (
    <Screen>
      <AppBar
        back
        onBack={() => nav('/app/home')}
        title={t('result.title')}
        subtitle={scan.id}
        right={
          speechSupported() ? (
            <button
              type="button"
              onClick={toggleSpeak}
              aria-label={speaking ? t('result.stopReading') : t('result.readAloud')}
              className={`grid h-11 w-11 place-items-center rounded-full transition-colors ${
                speaking ? 'bg-brand-100 text-brand-700' : 'text-ink-600 hover:bg-ink-100'
              }`}
            >
              {speaking ? <Square size={16} strokeWidth={2.6} aria-hidden /> : <Volume2 size={19} strokeWidth={1.9} aria-hidden />}
            </button>
          ) : undefined
        }
      />

      <ScrollArea className="pb-4">
        {scan.expired && (
          <div className="flex items-center gap-2.5 bg-bad-base px-5 py-3 text-white" role="alert">
            <CalendarX size={18} strokeWidth={2.2} className="shrink-0" aria-hidden />
            <p className="text-sm font-semibold">{t('result.expired')}</p>
          </div>
        )}

        {/* verdict */}
        <div className={`gutter py-6 ${bad ? 'bg-bad-soft' : 'bg-ok-soft'}`} role="status">
          <div className="flex items-start gap-3.5">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white ${bad ? 'bg-bad-base' : 'bg-ok-base'}`}>
              {bad ? <TriangleAlert size={24} strokeWidth={2} aria-hidden /> : <ShieldCheck size={24} strokeWidth={2} aria-hidden />}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className={`font-display text-2xl tracking-[-0.02em] ${bad ? 'text-bad-text' : 'text-ok-text'}`}>
                {bad ? t('result.violation') : t('result.pass')}
              </h1>
              <p className={`mt-1 text-sm leading-relaxed ${bad ? 'text-bad-text/80' : 'text-ok-text/80'}`}>
                {bad
                  ? `${violations.length} required ${violations.length === 1 ? 'declaration is' : 'declarations are'} missing or improperly printed.`
                  : t('result.allPresent')}
              </p>
            </div>
            <div className="shrink-0 text-center">
              <div
                className={`grid h-12 w-12 place-items-center rounded-xl border-2 font-display text-xl font-bold ${
                  bad ? 'border-bad-base text-bad-base' : 'border-ok-base text-ok-base'
                }`}
                aria-label={`Compliance grade ${scan.grade}`}
              >
                {scan.grade}
              </div>
              <div className={`mt-1 text-2xs font-semibold uppercase tracking-wider ${bad ? 'text-bad-text/70' : 'text-ok-text/70'}`}>
                {t('result.grade')}
              </div>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-current/10 pt-4">
            {[
              ['Product', scan.productName],
              ['Score', `${scan.score}% of checks passed`],
              ['Scanned', new Date(scan.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
              ['Checks run', `${scan.findings.length} rules`],
            ].map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className={`text-2xs font-semibold uppercase tracking-[0.07em] ${bad ? 'text-bad-text/60' : 'text-ok-text/60'}`}>{k}</dt>
                <dd className={`mt-0.5 truncate text-sm font-medium ${bad ? 'text-bad-text' : 'text-ok-text'}`}>{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* annotated capture */}
        <section className="gutter pt-6">
          <h2 className="font-display text-md font-semibold">{t('result.onLabel')}</h2>
          <p className="mt-1 text-sm text-ink-500">
            {boxed.length ? t('result.tapBox') : t('result.noBoxes')}
          </p>

          <div className="relative mt-3 overflow-hidden rounded-xl border border-ink-200 bg-ink-100">
            <img src={scan.imageDataUrl} alt={`Captured label of ${scan.productName}`} className="block w-full" />
            {boxed.map((f) => {
              const active = focused === f.id
              const ok = f.passed
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFocused(active ? null : f.id)}
                  aria-pressed={active}
                  aria-label={`${f.label}: ${ok ? 'passes' : 'fails'}`}
                  className="absolute rounded-md border-2 transition-all duration-200"
                  style={{
                    left: `${f.box!.x}%`,
                    top: `${f.box!.y}%`,
                    width: `${f.box!.w}%`,
                    height: `${f.box!.h}%`,
                    borderColor: ok ? 'var(--cmp-ok)' : 'var(--cmp-bad)',
                    background: active ? (ok ? 'rgba(46,125,50,0.22)' : 'rgba(198,40,40,0.22)') : 'transparent',
                    boxShadow: active ? `0 0 0 3px ${ok ? 'rgba(46,125,50,0.3)' : 'rgba(198,40,40,0.3)'}` : 'none',
                  }}
                >
                  {active && (
                    <span
                      className="absolute -top-1 left-0 -translate-y-full whitespace-nowrap rounded px-1.5 py-0.5 text-2xs font-semibold text-white"
                      style={{ background: ok ? 'var(--cmp-ok)' : 'var(--cmp-bad)' }}
                    >
                      {f.label}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {scan.barcode && (
            <p className="mt-2.5 flex items-center gap-2 text-xs text-ink-500">
              <Barcode size={14} className="shrink-0 text-ink-400" aria-hidden />
              Barcode {scan.barcode}
              {!online && <span className="inline-flex items-center gap-1"><WifiOff size={11} aria-hidden /> {t('result.notVerified')}</span>}
            </p>
          )}
        </section>

        {/* violations */}
        {violations.length > 0 && (
          <section className="gutter pt-7">
            <h2 className="font-display text-md font-semibold">{t('result.citedViolations')}</h2>
            <ul className="mt-3 space-y-2.5">
              {violations.map((v) => (
                <li key={v.id} className="rounded-xl border border-bad-soft bg-bad-soft/50 p-4">
                  <div className="flex items-start gap-2.5">
                    <X size={15} strokeWidth={3} className="mt-1 shrink-0 text-bad-base" aria-hidden />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-md font-semibold text-bad-text">{v.label}</h3>
                        <span className={v.severity === 'critical' ? 'badge-bad' : 'badge-warn'}>{v.severity}</span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-ink-600">{v.message}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{v.guidance}</p>
                      <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-md bg-surface px-2 py-1 text-xs font-medium text-ink-700">
                        <Scale size={12} strokeWidth={2} className="text-ink-400" aria-hidden />
                        {v.statute}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* full checklist */}
        <section className="gutter pt-7">
          <h2 className="font-display text-md font-semibold">{t('result.allChecks')}</h2>
          <ul className="card mt-3 divide-y divide-ink-200 overflow-hidden">
            {scan.findings.map((f) => (
              <li key={f.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${f.passed ? 'bg-ok-soft text-ok-base' : 'bg-bad-soft text-bad-base'}`}
                  aria-hidden
                >
                  {f.passed ? <Check size={13} strokeWidth={3} /> : <X size={13} strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink-900">{f.label}</span>
                  <span className="mt-0.5 block truncate text-xs text-ink-500">{f.statute}</span>
                </span>
                <span className={`max-w-[35%] shrink-0 truncate text-right text-sm tnum ${f.passed ? 'text-ink-600' : 'font-semibold text-bad-text'}`}>
                  {f.value ?? (f.passed ? '—' : 'Not found')}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="gutter pt-5">
          <button type="button" onClick={() => nav(`/app/report/${scan.id}`)} className="card-interactive flex w-full items-center gap-3 p-4 text-left">
            <FileText size={19} strokeWidth={1.9} className="shrink-0 text-ink-500" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block text-md font-medium text-ink-900">{t('result.detailedReport')}</span>
              <span className="mt-0.5 block text-xs text-ink-500">{t('result.detailedReportSub')}</span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-ink-300" aria-hidden />
          </button>
        </div>
      </ScrollArea>

      <div className="safe-b gutter flex gap-2.5 border-t border-ink-200 bg-surface py-3.5">
        <button type="button" onClick={() => nav('/app/scan')} className="btn-secondary" aria-label={t('result.scanAnother')}>
          <RotateCcw size={17} strokeWidth={2} aria-hidden />
        </button>
        <button type="button" onClick={() => shareScan(scan)} className="btn-secondary" aria-label={t('result.shareSummary')}>
          <Share2 size={17} strokeWidth={2} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => {
            setPdfBusy(true)
            void shareReportPdf(scan, { place: scan.place }).finally(() => setPdfBusy(false))
          }}
          disabled={pdfBusy}
          className="btn-secondary flex-1 disabled:opacity-60"
        >
          <FileDown size={17} strokeWidth={2} aria-hidden />
          {pdfBusy ? 'Preparing…' : 'PDF'}
        </button>
        {bad ? (
          <button type="button" onClick={() => nav(`/app/complaint?scan=${scan.id}`)} className="btn-danger flex-1">
            {t('result.reportIt')}
          </button>
        ) : (
          <button type="button" onClick={() => nav('/app/home')} className="btn-primary flex-1">
            {t('result.done')}
          </button>
        )}
      </div>
    </Screen>
  )
}
