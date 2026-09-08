import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Loader2 } from 'lucide-react'
import { Screen } from '../components/UI'
import { Mark } from '../components/Brand'

const steps = [
  'Checking image quality',
  'Compressing to under 500 KB',
  'Extracting label text',
  'Cross-checking the barcode',
  'Applying LMPC & FSSAI rules',
  'Preparing your verdict',
]

export default function Processing() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const demo = params.get('demo') || 'pass'
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (step >= steps.length) {
      const t = setTimeout(() => nav(demo === 'retake' ? '/app/retake' : `/app/result?demo=${demo}`, { replace: true }), 320)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setStep((s) => s + 1), step === 0 ? 480 : 620)
    return () => clearTimeout(t)
  }, [step, demo, nav])

  const pct = Math.round((step / steps.length) * 100)

  return (
    <Screen>
      <div className="flex flex-1 flex-col justify-center gutter pb-16">
        <div className="flex flex-col items-center text-center">
          <Mark size={52} className="text-brand-500" />
          <h1 className="mt-5 font-display text-2xl">Analysing the label</h1>
          <p className="mt-1.5 text-sm text-ink-500">The AI reads. The rule engine decides.</p>
        </div>

        {/* progress */}
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
            <div
              className="h-full rounded-full bg-brand-500 transition-[width] duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* step list */}
        <ol className="mt-7 space-y-0.5">
          {steps.map((label, i) => {
            const done = i < step
            const active = i === step
            return (
              <li
                key={label}
                className={`flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors duration-300 ${
                  active ? 'bg-brand-50' : ''
                }`}
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
                <span
                  className={`text-sm transition-colors duration-300 ${
                    done ? 'text-ink-500' : active ? 'font-semibold text-brand-800' : 'text-ink-400'
                  }`}
                >
                  {label}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </Screen>
  )
}
