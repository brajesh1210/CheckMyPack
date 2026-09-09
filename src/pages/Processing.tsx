import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
import { Screen, ScrollArea } from '../components/UI'
import { useScanRun } from '../scan/ScanRunner'
import { useApp } from '../store/app'

const STAGES = [
  { id: 1, titleKey: 'processing.stage1', subKey: 'processing.stage1Sub' },
  { id: 2, titleKey: 'processing.stage2', subKey: 'processing.stage2Sub' },
  { id: 3, titleKey: 'processing.stage3', subKey: 'processing.stage3Sub' },
  { id: 4, titleKey: 'processing.stage4', subKey: 'processing.stage4Sub' },
  { id: 5, titleKey: 'processing.stage5', subKey: 'processing.stage5Sub' },
  { id: 6, titleKey: 'processing.stage6', subKey: 'processing.stage6Sub' },
]

export default function Processing() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { status, outcome } = useScanRun()
  const [completedStep, setCompletedStep] = useState(1)

  // Smooth staged progression animation
  useEffect(() => {
    const intervals = [
      setTimeout(() => setCompletedStep(2), 500),
      setTimeout(() => setCompletedStep(3), 1100),
      setTimeout(() => setCompletedStep(4), 1700),
      setTimeout(() => setCompletedStep(5), 2300),
      setTimeout(() => setCompletedStep(6), 2900),
    ]
    return () => intervals.forEach(clearTimeout)
  }, [])

  // Transition to Result or Retake when analysis finishes
  useEffect(() => {
    if (completedStep >= 6) {
      const timer = setTimeout(() => {
        if (outcome?.engine?.verdict === 'RETAKE') {
          nav('/app/retake', { replace: true })
        } else if (outcome?.id) {
          nav(`/app/result/${outcome.id}`, { replace: true })
        } else {
          nav('/app/result', { replace: true })
        }
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [completedStep, outcome, nav])

  return (
    <Screen>
      <header className="sticky top-0 z-30 flex min-h-[60px] items-center px-3">
        <button
          type="button"
          onClick={() => nav('/app/scan')}
          aria-label={t('common.back')}
          className="grid h-11 w-11 place-items-center rounded-full text-ink-600 hover:bg-ink-100"
        >
          <ArrowLeft size={22} strokeWidth={2} aria-hidden />
        </button>
      </header>

      <ScrollArea className="gutter pb-8">
        <div className="pt-1">
          <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-ink-900">
            {t('processing.title')}
          </h1>
          <p className="mt-1 text-xs text-ink-500">
            {t('processing.sub')}
          </p>
        </div>

        {/* -------------------------------------- 3D Holographic Scanning Cube */}
        <div className="relative my-6 flex h-36 items-center justify-center overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-b from-brand-50/80 to-surface p-4 shadow-sm">
          {/* Pulsing ring */}
          <div className="absolute h-28 w-28 rounded-full border border-brand-400/40 animate-ping" />
          
          {/* 3D Isometric Cube Box */}
          <div className="relative z-10">
            <svg viewBox="0 0 80 80" className="h-24 w-24 text-brand-600 drop-shadow-md" fill="none" aria-hidden>
              {/* Top face */}
              <path d="M40 14L64 26L40 38L16 26Z" fill="var(--cmp-ok-soft)" stroke="var(--cmp-ok)" strokeWidth="2" strokeLinejoin="round" />
              {/* Left face */}
              <path d="M16 26L40 38V66L16 54Z" fill="var(--cmp-ok-line)" stroke="var(--cmp-ok)" strokeWidth="2" strokeLinejoin="round" />
              {/* Right face */}
              <path d="M40 38L64 26V54L40 66Z" fill="var(--cmp-ok-soft)" stroke="var(--cmp-ok)" strokeWidth="2" strokeLinejoin="round" />
              {/* Inner check / scan beam */}
              <path d="M30 48L37 55L50 42" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* ------------------------------------- Step-by-Step Progress Checklist */}
        <div className="space-y-3">
          {STAGES.map(({ id, titleKey, subKey }) => {
            const isDone = completedStep >= id
            const isCurrent = completedStep === id - 1
            return (
              <div
                key={id}
                className={`flex items-start gap-3 rounded-2xl p-3 transition-all duration-300 ${
                  isDone ? 'bg-surface border border-ok-base/20 shadow-xs' : isCurrent ? 'bg-brand-50/60 border border-brand-200' : 'opacity-45'
                }`}
              >
                {/* Step check icon */}
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold transition-all ${
                    isDone
                      ? 'bg-ok-base text-white shadow-sm'
                      : isCurrent
                        ? 'border-2 border-brand-500 bg-surface text-brand-700'
                        : 'border border-ink-300 bg-ink-100 text-ink-400'
                  }`}
                >
                  {isDone ? <Check size={14} strokeWidth={3} aria-hidden /> : isCurrent ? <Loader2 size={13} className="animate-spin" aria-hidden /> : id}
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className={`text-sm font-semibold ${isDone ? 'text-ink-900' : 'text-ink-600'}`}>
                    {t(titleKey)}
                  </h3>
                  <p className="mt-0.5 text-xs text-ink-500">{t(subKey)}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer Principle */}
        <div className="mt-6 rounded-2xl bg-ink-50 p-3.5 text-center">
          <p className="text-xs font-medium text-ink-600">
            {t('processing.principle')}
          </p>
        </div>
      </ScrollArea>
    </Screen>
  )
}
