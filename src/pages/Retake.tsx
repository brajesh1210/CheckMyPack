import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react'
import { Screen, ScrollArea } from '../components/UI'
import { PackVisual } from '../components/PackVisual'

export default function Retake() {
  const { t } = useTranslation()
  const nav = useNavigate()

  return (
    <Screen>
      <header className="sticky top-0 z-30 flex min-h-[60px] items-center gap-2 px-3 border-b border-ink-200/60 bg-surface/90 backdrop-blur-md">
        <button
          type="button"
          onClick={() => nav('/app/scan')}
          aria-label={t('common.back')}
          className="grid h-11 w-11 place-items-center rounded-full text-ink-600 hover:bg-ink-100"
        >
          <ArrowLeft size={22} strokeWidth={2} aria-hidden />
        </button>
        <h1 className="font-display text-md font-semibold text-ink-900">
          {t('retake.title')}
        </h1>
      </header>

      <ScrollArea className="gutter pb-8">
        {/* Photo with Glare Specular Highlight */}
        <div className="relative mt-4 overflow-hidden rounded-3xl border border-ink-200 shadow-md">
          <PackVisual product="cashew" glare={true} className="h-44 w-full" />
        </div>

        {/* Warning Callout Box */}
        <div className="mt-5 rounded-2xl border border-warn-base/30 bg-warn-soft p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warn-base text-white shadow-sm">
              <AlertTriangle size={20} strokeWidth={2.4} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-md font-bold text-warn-text">
                {t('retake.heading')}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-warn-text/90">
                {t('retake.sub')}
              </p>
            </div>
          </div>
        </div>

        {/* Improvement Tips Checklist */}
        <div className="mt-6">
          <h3 className="font-display text-sm font-bold text-ink-900">
            {t('retake.howToFix')}
          </h3>
          <ul className="mt-3 space-y-2.5">
            <li className="flex items-center gap-3 rounded-xl bg-surface p-3 shadow-xs border border-ink-200/80">
              <CheckCircle2 size={18} className="shrink-0 text-brand-600" aria-hidden />
              <span className="text-xs font-medium text-ink-800">{t('retake.tip1')}</span>
            </li>
            <li className="flex items-center gap-3 rounded-xl bg-surface p-3 shadow-xs border border-ink-200/80">
              <CheckCircle2 size={18} className="shrink-0 text-brand-600" aria-hidden />
              <span className="text-xs font-medium text-ink-800">{t('retake.tip2')}</span>
            </li>
            <li className="flex items-center gap-3 rounded-xl bg-surface p-3 shadow-xs border border-ink-200/80">
              <CheckCircle2 size={18} className="shrink-0 text-brand-600" aria-hidden />
              <span className="text-xs font-medium text-ink-800">{t('retake.tip3')}</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="mt-7 space-y-3">
          <button
            type="button"
            onClick={() => nav('/app/scan')}
            className="btn-accent btn-block min-h-[48px] rounded-xl text-md font-semibold"
          >
            <RefreshCw size={18} strokeWidth={2.2} aria-hidden />
            {t('retake.retakePhoto')}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => nav('/app/guidelines')}
              className="text-xs font-semibold text-accent-600 hover:text-accent-700 underline"
            >
              {t('retake.guide')}
            </button>
          </div>
        </div>
      </ScrollArea>
    </Screen>
  )
}
