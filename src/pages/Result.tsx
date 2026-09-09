import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ShieldCheck, AlertTriangle, Check, Volume2, Square, Share2, Download,
  ArrowLeft, ArrowRight, ExternalLink, CheckCircle2, FileText
} from 'lucide-react'
import { Screen, ScrollArea } from '../components/UI'
import { PackVisual } from '../components/PackVisual'
import { useApp } from '../store/app'
import { speak, stopSpeaking, speechSupported, verdictScript } from '../lib/speech'
import { shareScan, shareReportPdf } from '../lib/share'
import { downloadPdfReport } from '../lib/pdf'

export default function Result() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { id } = useParams()
  const { scans, lastScanId, lang, voice } = useApp()
  const scan = useMemo(() => scans.find((s) => s.id === (id ?? lastScanId)) ?? scans[0], [scans, id, lastScanId])
  const [speaking, setSpeaking] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)

  const isViolation = scan?.verdict === 'VIOLATION'
  const isPass = scan?.verdict === 'PASS'

  const violations = scan?.findings.filter((f) => !f.passed) ?? []

  const script = scan
    ? verdictScript(lang, {
        productName: scan.productName,
        verdict: scan.verdict,
        grade: scan.grade,
        violationCount: violations.length,
        expired: scan.expired,
      })
    : ''

  // Optional spoken announcement
  useEffect(() => {
    if (!scan || !voice || !speechSupported()) return
    const timer = setTimeout(() => {
      setSpeaking(true)
      speak(script, lang, () => setSpeaking(false))
    }, 400)
    return () => {
      clearTimeout(timer)
      stopSpeaking()
    }
  }, [scan?.id, voice, lang, script])

  const toggleSpeak = () => {
    if (speaking) {
      stopSpeaking()
      setSpeaking(false)
    } else {
      setSpeaking(true)
      speak(script, lang, () => setSpeaking(false))
    }
  }

  const handlePdf = async () => {
    if (!scan) return
    setPdfBusy(true)
    try {
      await downloadPdfReport(scan)
    } finally {
      setPdfBusy(false)
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
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <p className="text-sm text-ink-500">{t('result.none')}</p>
          <button type="button" onClick={() => nav('/app/scan')} className="btn-primary mt-4">
            {t('result.scanAPack')}
          </button>
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
          onClick={() => nav('/app/home')}
          aria-label={t('common.back')}
          className="grid h-11 w-11 place-items-center rounded-full text-ink-600 hover:bg-ink-100"
        >
          <ArrowLeft size={22} strokeWidth={2} aria-hidden />
        </button>

        <h1 className="font-display text-md font-semibold text-ink-900">
          {t('result.title')}
        </h1>

        <button
          type="button"
          onClick={toggleSpeak}
          aria-label={speaking ? t('result.stopReading') : t('result.readAloud')}
          className={`grid h-11 w-11 place-items-center rounded-full transition-colors ${
            speaking ? 'bg-brand-100 text-brand-700' : 'text-ink-600 hover:bg-ink-100'
          }`}
        >
          {speaking ? <Square size={16} strokeWidth={2.6} aria-hidden /> : <Volume2 size={20} strokeWidth={2} aria-hidden />}
        </button>
      </header>

      <ScrollArea className="gutter pb-8">
        {/* ==================================================== PASS RESULT (Screen 8) */}
        {isPass && (
          <div className="pt-3">
            {/* Big Status Banner */}
            <div className="flex items-center justify-between rounded-3xl border border-ok-base/20 bg-ok-soft p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ok-base text-white shadow-md">
                  <Check size={26} strokeWidth={3} aria-hidden />
                </span>
                <div>
                  <h2 className="font-display text-xl font-bold tracking-tight text-ok-text">
                    {t('result.pass')}
                  </h2>
                  <p className="mt-0.5 text-xs text-ok-text/80">
                    {t('result.allPresent')}
                  </p>
                </div>
              </div>
              <span className="rounded-xl border border-ok-base/30 bg-white/90 px-3 py-1 font-display text-xs font-bold text-ok-base shadow-xs">
                {t('result.gradeA')}
              </span>
            </div>

            {/* Product Pack Photo with Green Verified Highlight */}
            <div className="mt-4 overflow-hidden rounded-3xl border border-ok-base/30 shadow-sm">
              <PackVisual product={scan.productName} highlight="pass" className="h-44 w-full" />
            </div>

            {/* Compliance Summary Table Card */}
            <div className="mt-5 rounded-2xl border border-ink-200/80 bg-surface p-4 shadow-xs">
              <h3 className="font-display text-sm font-bold text-ink-900">
                {t('result.allChecks')}
              </h3>

              <div className="mt-3 divide-y divide-ink-100 text-xs">
                {[
                  ['MRP', 'Pass'],
                  ['Net Quantity', 'Pass'],
                  ['Manufacturing Date', 'Pass'],
                  ['Best Before', 'Pass'],
                  ['FSSAI Licence', 'Pass'],
                  ['Manufacturer Details', 'Pass'],
                  ['Consumer Care', 'Pass'],
                  ['Veg / Non-Veg Symbol', 'Pass'],
                ].map(([label, status]) => (
                  <div key={label} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="grid h-4 w-4 place-items-center rounded-full bg-ok-soft text-ok-base">
                        <Check size={11} strokeWidth={3} aria-hidden />
                      </span>
                      <span className="font-medium text-ink-800">{label}</span>
                    </div>
                    <span className="font-semibold text-ok-base">✓ {status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => nav(`/app/report/${scan.id}`)}
                className="btn-primary btn-block min-h-[48px] rounded-xl text-md font-semibold"
              >
                {t('result.detailedReport')}
                <ArrowRight size={18} strokeWidth={2.2} aria-hidden />
              </button>

              <div className="flex items-center justify-around pt-1">
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-1.5 text-xs font-semibold text-ink-600 hover:text-ink-900"
                >
                  <Share2 size={16} strokeWidth={2} aria-hidden />
                  {t('result.shareSummary')}
                </button>
                <button
                  type="button"
                  onClick={handlePdf}
                  className="flex items-center gap-1.5 text-xs font-semibold text-ink-600 hover:text-ink-900"
                >
                  <Download size={16} strokeWidth={2} aria-hidden />
                  {t('result.pdf')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== VIOLATION RESULT (Screen 9) */}
        {isViolation && (
          <div className="pt-3">
            {/* Big Violation Status Banner */}
            <div className="flex items-center justify-between rounded-3xl border border-bad-base/20 bg-bad-soft p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-bad-base text-white shadow-md">
                  <AlertTriangle size={24} strokeWidth={2.4} aria-hidden />
                </span>
                <div>
                  <h2 className="font-display text-md font-bold tracking-tight text-bad-text">
                    {t('result.violation')}
                  </h2>
                  <p className="mt-0.5 text-xs text-bad-text/80">
                    {t('result.issuesDetected', { count: 2 })}
                  </p>
                </div>
              </div>
              <span className="rounded-xl border border-bad-base/30 bg-white/90 px-3 py-1 font-display text-xs font-bold text-bad-base shadow-xs">
                {t('result.gradeC')}
              </span>
            </div>

            {/* Product Pack Photo with Red Violation Highlight */}
            <div className="mt-4 overflow-hidden rounded-3xl border border-bad-base/30 shadow-sm">
              <PackVisual product={scan.productName} highlight="violation" className="h-44 w-full" />
            </div>

            {/* Violation Breakdown Detail Card */}
            <div className="mt-4 rounded-2xl border border-bad-base/30 bg-bad-soft/40 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-bad-text">
                  {t('result.mrpIssueTitle')}
                </h3>
                <span className="rounded-md bg-white/80 px-2 py-0.5 text-2xs font-bold text-bad-text border border-bad-base/20">
                  {t('result.legalRefLmpc6')}
                </span>
              </div>
              <p className="mt-1.5 text-xs font-medium text-ink-700">
                {t('result.mrpIssueDesc')}
              </p>

              <div className="mt-3 rounded-xl bg-white/80 p-3 text-2xs text-ink-600 border border-ink-100">
                <span className="font-bold text-ink-800">{t('result.whatThisMeans')}: </span>
                {t('result.whatThisMeansDesc')}
              </div>
            </div>

            {/* Issues Summary Count Box */}
            <div className="mt-4 rounded-2xl border border-ink-200/80 bg-surface p-4 shadow-xs">
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-ink-500">
                {t('result.issuesDetected', { count: 2 })}
              </h4>
              <ol className="mt-2.5 space-y-1.5 text-xs font-medium text-ink-800">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-bad-base" />
                  1. {t('result.mrpIssueTitle')}
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-bad-base" />
                  2. Consumer care details
                </li>
              </ol>
            </div>

            {/* Action Bar */}
            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => nav(`/app/report/${scan.id}`)}
                className="btn btn-block min-h-[48px] rounded-xl bg-ink-900 text-white hover:bg-ink-800 font-semibold"
              >
                <FileText size={18} strokeWidth={2} aria-hidden />
                {t('result.viewFullReport')}
              </button>

              <button
                type="button"
                onClick={() => nav(`/app/complaint?scan=${scan.id}`)}
                className="btn-accent btn-block min-h-[48px] rounded-xl font-semibold"
              >
                {t('result.raiseAComplaint')}
                <ArrowRight size={18} strokeWidth={2.2} aria-hidden />
              </button>
            </div>
          </div>
        )}
      </ScrollArea>
    </Screen>
  )
}
