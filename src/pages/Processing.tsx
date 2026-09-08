import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Loader2, TriangleAlert } from 'lucide-react'
import { Screen } from '../components/UI'
import { Mark } from '../components/Brand'
import { useScanRun } from '../scan/ScanRunner'
import type { Stage } from '../lib/pipeline'

const STAGES: { key: Stage; label: string }[] = [
  { key: 'compress', label: 'Compressing to under 500 KB' },
  { key: 'quality', label: 'Checking image quality' },
  { key: 'read', label: 'Reading the label text' },
  { key: 'extract', label: 'Identifying declarations' },
  { key: 'barcode', label: 'Cross-checking the barcode' },
  { key: 'rules', label: 'Applying LMPC & FSSAI rules' },
]

export default function Processing() {
  const nav = useNavigate()
  const { status, progress, outcome, error } = useScanRun()

  useEffect(() => {
    if (status === 'idle') nav('/app/scan', { replace: true })
  }, [status, nav])

  useEffect(() => {
    if (status === 'done' && outcome) {
      const t = setTimeout(
        () => nav(outcome.engine.verdict === 'RETAKE' ? '/app/retake' : '/app/result', { replace: true }),
        340,
      )
      return () => clearTimeout(t)
    }
  }, [status, outcome, nav])

  const currentIndex = progress ? STAGES.findIndex((s) => s.key === progress.stage) : 0
  const idx = progress?.stage === 'done' ? STAGES.length : Math.max(0, currentIndex)
  const ocrSub = progress?.stage === 'read' ? progress.progress ?? 0 : 0
  const pct = Math.min(100, Math.round(((idx + (progress?.stage === 'read' ? ocrSub : 0)) / STAGES.length) * 100))

  if (status === 'error') {
    return (
      <Screen>
        <div className="flex flex-1 flex-col items-center justify-center gutter text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-bad-soft text-bad-base">
            <TriangleAlert size={26} strokeWidth={2} aria-hidden />
          </span>
          <h1 className="mt-5 font-display text-xl">The scan could not finish</h1>
          <p className="mt-2 max-w-[36ch] text-sm leading-relaxed text-ink-500">{error}</p>
          <button type="button" onClick={() => nav('/app/scan', { replace: true })} className="btn-primary mt-6">
            Try again
          </button>
        </div>
      </Screen>
    )
  }

  return (
    <Screen>
      <div className="flex flex-1 flex-col justify-center gutter pb-16">
        <div className="flex flex-col items-center text-center">
          <Mark size={52} className="text-brand-500" />
          <h1 className="mt-5 font-display text-2xl">Analysing the label</h1>
          <p className="mt-1.5 text-sm text-ink-500">The reader extracts. The rule engine decides.</p>
        </div>

        <div className="mt-8">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-xs font-medium text-ink-500">Progress</span>
            <span className="text-xs font-semibold text-ink-800 tnum" aria-live="polite">
              {pct}%
            </span>
          </div>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-ink-200"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Analysis progress"
          >
            <div className="h-full rounded-full bg-brand-500 transition-[width] duration-300 ease-out" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <ol className="mt-7 space-y-0.5">
          {STAGES.map((s, i) => {
            const done = i < idx
            const active = i === idx
            return (
              <li
                key={s.key}
                className={`flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors duration-300 ${active ? 'bg-brand-50' : ''}`}
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full transition-colors duration-300 ${
                    done ? 'bg-brand-500 text-white' : active ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-400'
                  }`}
                  aria-hidden
                >
                  {done ? (
                    <Check size={13} strokeWidth={3} />
                  ) : active ? (
                    <Loader2 size={13} strokeWidth={2.6} className="animate-spin" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  )}
                </span>
                <span className={`flex-1 text-sm transition-colors duration-300 ${done ? 'text-ink-500' : active ? 'font-semibold text-brand-800' : 'text-ink-400'}`}>
                  {s.label}
                </span>
                {active && s.key === 'read' && ocrSub > 0 && (
                  <span className="text-xs font-semibold text-brand-700 tnum">{Math.round(ocrSub * 100)}%</span>
                )}
              </li>
            )
          })}
        </ol>

        <p className="mt-6 text-center text-xs leading-relaxed text-ink-400">
          Text is read on this device. Nothing is uploaded unless you share it.
        </p>
      </div>
    </Screen>
  )
}
