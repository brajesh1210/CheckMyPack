import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, HelpCircle, Zap, ZapOff, Image as ImageIcon, Camera, Sparkles, ChevronDown } from 'lucide-react'
import { Screen } from '../components/UI'
import { openCamera, stopStream } from '../lib/capture'
import { useScanRun } from '../scan/ScanRunner'
import { isNative, nativePhoto } from '../lib/native'

const SAMPLES = [
  { id: 'compliant', name: 'Amul Taaza Milk', label: 'Amul Milk', verdict: 'PASS', grade: 'A' },
  { id: 'violation', name: 'Britannia Sunfeast', label: 'Sunfeast Biscuit', verdict: 'VIOLATION', grade: 'C' },
  { id: 'blurry', name: 'Roasted Cashew', label: 'Cashew Pack', verdict: 'RETAKE', grade: 'C' },
]

export default function Scan() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const { startFromBlob, startFromVideo, startSample } = useScanRun()

  const [activeSample, setActiveSample] = useState('compliant')
  const [cameraActive, setCameraActive] = useState(false)
  const [flashOn, setFlashOn] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [samplesOpen, setSamplesOpen] = useState(false)

  // Web camera initialization (for browser development only)
  useEffect(() => {
    if (isNative()) return

    let cancelled = false
    openCamera()
      .then((stream) => {
        if (cancelled) {
          stopStream(stream)
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
        setCameraActive(true)
      })
      .catch(() => {
        setCameraActive(false)
      })

    return () => {
      cancelled = true
      stopStream(streamRef.current)
    }
  }, [])

  // Primary Camera Capture: opens native camera on Android, or captures frame on Web
  const handleCapture = async () => {
    if (isNative()) {
      try {
        const blob = await nativePhoto('camera')
        if (blob) {
          startFromBlob(blob)
          nav('/app/processing')
        }
      } catch {
        // Cancelled by user
      }
      return
    }

    if (cameraActive && videoRef.current) {
      startFromVideo(videoRef.current)
      nav('/app/processing')
      return
    }

    startSample(activeSample)
    nav('/app/processing')
  }

  // Gallery / File Upload handler
  const handlePickGallery = async () => {
    if (isNative()) {
      try {
        const blob = await nativePhoto('gallery')
        if (blob) {
          startFromBlob(blob)
          nav('/app/processing')
          return
        }
      } catch {
        // Fallback
      }
    }
    fileRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    startFromBlob(file)
    nav('/app/processing')
  }

  const handleUseSample = (id: string) => {
    startSample(id)
    nav('/app/processing')
  }

  return (
    <Screen className="bg-canvasWarm text-ink-900">
      {/* ---------------------------------------------------- Top Header */}
      <header className="sticky top-0 z-30 flex min-h-[60px] items-center justify-between px-4 border-b border-ink-200/60 bg-surface/90 backdrop-blur-md">
        <button
          type="button"
          onClick={() => nav(-1)}
          aria-label={t('common.back')}
          className="grid h-11 w-11 place-items-center rounded-full text-ink-800 hover:bg-ink-100"
        >
          <ArrowLeft size={22} strokeWidth={2} aria-hidden />
        </button>
        <h1 className="font-display text-base font-semibold text-ink-900">
          {t('scan.title')}
        </h1>
        <button
          type="button"
          onClick={() => setHelpOpen((h) => !h)}
          aria-label={t('scan.tips')}
          className="grid h-11 w-11 place-items-center rounded-full text-ink-800 hover:bg-ink-100"
        >
          <HelpCircle size={20} strokeWidth={2} aria-hidden />
        </button>
      </header>

      {/* --------------------------------------------- Main Viewfinder */}
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-2">
        {/* Viewfinder Target Frame (Tapping opens the Camera directly) */}
        <div
          onClick={handleCapture}
          className="relative aspect-[3/4] w-full max-w-[320px] overflow-hidden rounded-3xl border-2 border-brand-500 bg-gradient-to-b from-stone-900 via-stone-950 to-ink-950 shadow-xl cursor-pointer select-none"
        >
          {/* Desktop Web Video (only rendered in desktop browser) */}
          {!isNative() && cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
          ) : (
            /* Viewfinder Center UI */
            <div className="relative flex h-full w-full flex-col items-center justify-center p-6 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/40 shadow-md">
                <Camera size={32} strokeWidth={1.8} aria-hidden />
              </div>
              <p className="mt-3 font-display text-sm font-bold text-white">
                {t('scan.title')}
              </p>
              <p className="mt-1 text-xs text-ink-300">
                {t('scan.hintGood')}
              </p>

              {/* Tap to Open Camera Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleCapture()
                }}
                className="btn-primary min-h-[44px] mt-4 rounded-full px-5 text-xs font-semibold shadow-lg"
              >
                <Camera size={16} strokeWidth={2.2} aria-hidden />
                <span>{t('scan.capture')}</span>
              </button>

              {/* Active preset note */}
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-2xs text-ink-300">
                <span>{t('scan.samplePacks')}: </span>
                <span className="font-semibold text-brand-400">
                  {SAMPLES.find((s) => s.id === activeSample)?.name}
                </span>
              </div>
            </div>
          )}

          {/* Animated Laser Scanning Reticle */}
          <div className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-brand-400 to-transparent shadow-lg animate-scan-line" />

          {/* Golden Corner Guide Brackets */}
          <div className="pointer-events-none absolute inset-3" aria-hidden>
            <div className="absolute left-0 top-0 h-7 w-7 rounded-tl-xl border-l-4 border-t-4 border-brand-400" />
            <div className="absolute right-0 top-0 h-7 w-7 rounded-tr-xl border-r-4 border-t-4 border-brand-400" />
            <div className="absolute bottom-0 left-0 h-7 w-7 rounded-bl-xl border-b-4 border-l-4 border-brand-400" />
            <div className="absolute bottom-0 right-0 h-7 w-7 rounded-br-xl border-b-4 border-r-4 border-brand-400" />
          </div>
        </div>

        {/* Guidance Tips Badges in High-Contrast Ink */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 px-2">
          <span className="chip border-ink-200 bg-surface text-ink-800 text-2xs py-1 px-2.5 shadow-xs">
            👁️ {t('scan.holdSteady')}
          </span>
          <span className="chip border-ink-200 bg-surface text-ink-800 text-2xs py-1 px-2.5 shadow-xs">
            ☀️ {t('scan.avoidGlare')}
          </span>
          <span className="chip border-ink-200 bg-surface text-ink-800 text-2xs py-1 px-2.5 shadow-xs">
            🏷️ {t('scan.showBackLabel')}
          </span>
        </div>

        {/* Optional Demo Sample Selector Pill */}
        <div className="mt-2.5">
          <button
            type="button"
            onClick={() => setSamplesOpen((s) => !s)}
            className="flex items-center gap-1.5 rounded-full border border-ink-300 bg-surface px-3 py-1 text-2xs font-semibold text-ink-800 hover:bg-ink-50 min-h-[44px] shadow-xs"
          >
            <Sparkles size={12} className="text-amber-600" aria-hidden />
            <span>{t('scan.useSample')}</span>
            <ChevronDown size={12} aria-hidden />
          </button>

          {samplesOpen && (
            <div className="mt-2 flex items-center justify-center gap-1.5 rounded-2xl bg-surface p-1.5 shadow-md border border-ink-200">
              {SAMPLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setActiveSample(s.id)
                    handleUseSample(s.id)
                  }}
                  className={`min-h-[44px] rounded-xl px-2.5 text-2xs font-semibold transition-all ${
                    s.verdict === 'PASS'
                      ? 'bg-ok-base text-white hover:bg-ok-base/90'
                      : s.verdict === 'VIOLATION'
                        ? 'bg-bad-base text-white hover:bg-bad-base/90'
                        : 'bg-warn-base text-white hover:bg-warn-base/90'
                  }`}
                >
                  {s.label} ({s.verdict})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------- Bottom Controls */}
      <div className="safe-b flex items-center justify-around px-8 pb-7 pt-2 border-t border-ink-200/60 bg-surface/80 backdrop-blur-sm">
        {/* Gallery / File Upload Button */}
        <button
          type="button"
          onClick={handlePickGallery}
          aria-label={t('scan.upload')}
          className="flex flex-col items-center gap-1 text-ink-800 hover:text-ink-950 transition-transform active:scale-95 min-h-[44px]"
        >
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink-100 border border-ink-200 shadow-sm text-ink-800">
            <ImageIcon size={22} strokeWidth={2} aria-hidden />
          </span>
          <span className="text-2xs font-semibold text-ink-900">{t('scan.upload')}</span>
        </button>

        {/* Hidden File Input for fallback */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileChange}
        />

        {/* Big Circular Shutter Button */}
        <button
          type="button"
          onClick={handleCapture}
          aria-label={t('scan.capture')}
          className="relative grid h-20 w-20 place-items-center rounded-full bg-brand-500/20 p-2 shadow-xl transition-transform active:scale-90 hover:bg-brand-500/30 min-h-[44px]"
        >
          <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-500 shadow-lg transition-all hover:scale-105">
            <span className="h-13 w-13 rounded-full border-2 border-white bg-brand-600" />
          </span>
        </button>

        {/* Flash Toggle */}
        <button
          type="button"
          onClick={() => setFlashOn((f) => !f)}
          aria-label={flashOn ? t('scan.flashOff') : t('scan.flashOn')}
          className="flex flex-col items-center gap-1 text-ink-800 hover:text-ink-950 transition-transform active:scale-95 min-h-[44px]"
        >
          <span className={`grid h-12 w-12 place-items-center rounded-2xl border border-ink-200 shadow-sm ${flashOn ? 'bg-amber-400 text-ink-950 font-bold' : 'bg-ink-100 text-ink-800'}`}>
            {flashOn ? <Zap size={22} strokeWidth={2.4} aria-hidden /> : <ZapOff size={22} strokeWidth={2} aria-hidden />}
          </span>
          <span className="text-2xs font-semibold text-ink-900">{t('scan.flash')}</span>
        </button>
      </div>

      {/* Help Tips Modal */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-t-3xl bg-surface p-6 text-ink-900 shadow-2xl">
            <h2 className="font-display text-lg font-bold">{t('scan.tips')}</h2>
            <ul className="mt-4 space-y-3 text-sm text-ink-600">
              <li className="flex gap-2.5">
                <span className="text-brand-600 font-bold">✓</span>
                <span>{t('guidelines.lightGood')}</span>
              </li>
              <li className="flex gap-2.5">
                <span className="text-brand-600 font-bold">✓</span>
                <span>{t('guidelines.steadyGood')}</span>
              </li>
              <li className="flex gap-2.5">
                <span className="text-brand-600 font-bold">✓</span>
                <span>{t('guidelines.frameGood')}</span>
              </li>
            </ul>
            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              className="btn-primary btn-block mt-6"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}
    </Screen>
  )
}