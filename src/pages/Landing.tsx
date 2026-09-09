import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Bell, Play, ArrowRight, ShieldCheck, Scale, Factory, Sparkles, X, CheckCircle2 } from 'lucide-react'
import { Screen, ScrollArea } from '../components/UI'
import { Wordmark } from '../components/Brand'

export default function Landing() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [videoOpen, setVideoOpen] = useState(false)

  return (
    <Screen>
      {/* -------------------------------------------------- Header bar */}
      <header className="sticky top-0 z-30 flex min-h-[60px] items-center justify-between border-b border-ink-200/60 bg-surface/90 px-4 backdrop-blur-md">
        <Wordmark size={28} />
        <button
          type="button"
          aria-label={t('home.notifications')}
          onClick={() => nav('/login')}
          className="relative grid h-11 w-11 place-items-center rounded-full text-ink-600 hover:bg-ink-100"
        >
          <Bell size={20} strokeWidth={2} aria-hidden />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-500" />
        </button>
      </header>

      <ScrollArea className="pb-8">
        {/* ---------------------------------------------------- Hero section */}
        <section className="gutter pt-5">
          <div className="max-w-[28ch]">
            <h1 className="font-display text-3xl font-bold leading-tight tracking-[-0.025em] text-ink-900">
              {t('landing.hero')}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              {t('landing.heroSub')}
            </p>
          </div>

          {/* Action buttons */}
          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => nav('/login')}
              className="btn-accent min-h-[48px] flex-1 rounded-xl text-md font-semibold"
            >
              {t('landing.getStarted')}
              <ArrowRight size={18} strokeWidth={2.2} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setVideoOpen(true)}
              className="btn-secondary min-h-[48px] px-4 text-md font-medium"
            >
              <Play size={16} strokeWidth={2.2} className="fill-ink-700" aria-hidden />
              {t('landing.watchVideo')}
            </button>
          </div>

          {/* ------------------------------------------- Hero Mockup Card */}
          <div className="relative mt-6 overflow-hidden rounded-3xl border border-brand-500/20 bg-gradient-to-b from-brand-50/60 via-amber-50/40 to-canvasWarm p-5 shadow-sm">
            <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-brand-500/15 blur-2xl" />
            <div aria-hidden className="pointer-events-none absolute -left-6 -bottom-6 h-32 w-32 rounded-full bg-accent-500/15 blur-2xl" />

            <div className="relative flex flex-col items-center text-center">
              {/* Phone scanning snack packet vector art */}
              <div className="relative my-2 h-48 w-44" aria-hidden>
                {/* Snack pack background */}
                <div className="absolute inset-x-2 bottom-0 top-3 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-3 shadow-md">
                  <div className="h-6 w-16 rounded-md bg-brand-700/80 px-2 py-0.5 text-2xs font-bold text-white">
                    {t('landing.sampleTitle')}
                  </div>
                  <div className="mt-2 h-2 w-24 rounded bg-white/60" />
                  <div className="mt-1 h-1.5 w-20 rounded bg-white/40" />
                  <div className="mt-1 h-1.5 w-14 rounded bg-white/30" />
                  <div className="absolute bottom-3 right-3 h-5 w-5 rounded bg-white p-0.5">
                    <div className="h-full w-full rounded-full bg-brand-600" />
                  </div>
                </div>

                {/* Scanning phone overlay */}
                <div className="absolute inset-x-6 bottom-4 top-0 rounded-2xl border-2 border-ink-800 bg-ink-900 p-1.5 shadow-xl">
                  <div className="h-full w-full overflow-hidden rounded-xl bg-ink-950 p-2 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-bold text-brand-300 tracking-wider">{t('landing.step1')}</span>
                      <Sparkles size={12} className="text-brand-400" aria-hidden />
                    </div>
                    {/* Viewfinder reticle */}
                    <div className="mt-2 flex h-24 flex-col items-center justify-center rounded-lg border border-dashed border-brand-400/80 bg-brand-500/10">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-500 text-white shadow-lg">
                        <CheckCircle2 size={24} strokeWidth={2.4} aria-hidden />
                      </div>
                      <span className="mt-1 text-2xs font-bold tracking-wider text-brand-300">{t('landing.verifiedStamp')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------- 3 Audience Cards */}
        <section className="gutter mt-6 space-y-2.5">
          <button
            type="button"
            onClick={() => {
              nav('/role')
            }}
            className="card-interactive flex w-full items-center gap-3.5 p-3.5 text-left"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ok-soft text-ok-base">
              <ShieldCheck size={22} strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-ink-900">{t('landing.forConsumers')}</h3>
              <p className="text-xs text-ink-500">{t('landing.forConsumersSub')}</p>
            </div>
            <ArrowRight size={16} className="text-ink-400" aria-hidden />
          </button>

          <button
            type="button"
            onClick={() => {
              nav('/role')
            }}
            className="card-interactive flex w-full items-center gap-3.5 p-3.5 text-left"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-info-soft text-info-base">
              <Scale size={22} strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-ink-900">{t('landing.forOfficers')}</h3>
              <p className="text-xs text-ink-500">{t('landing.forOfficersSub')}</p>
            </div>
            <ArrowRight size={16} className="text-ink-400" aria-hidden />
          </button>

          <button
            type="button"
            onClick={() => {
              nav('/role')
            }}
            className="card-interactive flex w-full items-center gap-3.5 p-3.5 text-left"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-purple-soft text-purple-base">
              <Factory size={22} strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-ink-900">{t('landing.forManufacturers')}</h3>
              <p className="text-xs text-ink-500">{t('landing.forManufacturersSub')}</p>
            </div>
            <ArrowRight size={16} className="text-ink-400" aria-hidden />
          </button>
        </section>

        {/* ---------------------------------------------------- Stats Row */}
        <section className="gutter mt-6">
          <div className="grid grid-cols-3 divide-x divide-ink-200 rounded-2xl border border-ink-200 bg-surface shadow-xs">
            <div className="p-3 text-center">
              <div className="font-display text-lg font-bold text-ink-900 tnum">10+</div>
              <div className="mt-0.5 text-2xs leading-tight text-ink-500">{t('landing.statChecked')}</div>
            </div>
            <div className="p-3 text-center">
              <div className="font-display text-lg font-bold text-ink-900 tnum">&lt; 10 sec</div>
              <div className="mt-0.5 text-2xs leading-tight text-ink-500">{t('landing.statVerdict')}</div>
            </div>
            <div className="p-3 text-center">
              <div className="font-display text-lg font-bold text-accent-600 tnum">14404</div>
              <div className="mt-0.5 text-2xs leading-tight text-ink-500">{t('landing.statHelpline')}</div>
            </div>
          </div>
        </section>
      </ScrollArea>

      {/* ------------------------------------------------ Video Modal */}
      {videoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/70 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-sm overflow-hidden bg-surface p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">{t('landing.howTitle')}</h2>
              <button
                type="button"
                onClick={() => setVideoOpen(false)}
                aria-label={t('common.close')}
                className="grid h-11 w-11 place-items-center rounded-full text-ink-600 hover:bg-ink-100"
              >
                <X size={20} aria-hidden />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex gap-3 rounded-xl bg-ink-50 p-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-500 text-xs font-bold text-white">1</span>
                <div>
                  <h3 className="text-sm font-semibold">{t('landing.step1')}</h3>
                  <p className="text-xs text-ink-500">{t('landing.step1d')}</p>
                </div>
              </div>
              <div className="flex gap-3 rounded-xl bg-ink-50 p-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-500 text-xs font-bold text-white">2</span>
                <div>
                  <h3 className="text-sm font-semibold">{t('landing.step2')}</h3>
                  <p className="text-xs text-ink-500">{t('landing.step2d')}</p>
                </div>
              </div>
              <div className="flex gap-3 rounded-xl bg-ink-50 p-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ok-base text-xs font-bold text-white">3</span>
                <div>
                  <h3 className="text-sm font-semibold">{t('landing.step3')}</h3>
                  <p className="text-xs text-ink-500">{t('landing.step3d')}</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setVideoOpen(false)
                nav('/app/scan')
              }}
              className="btn-primary btn-block mt-5"
            >
              {t('landing.startScanning')}
            </button>
          </div>
        </div>
      )}
    </Screen>
  )
}
