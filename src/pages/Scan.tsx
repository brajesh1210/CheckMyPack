import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Zap, ZapOff, Images, HelpCircle, Sparkles, CameraOff, Upload } from 'lucide-react'
import { Screen, AppBar, IconButton } from '../components/UI'
import { openCamera, stopStream } from '../lib/capture'
import { assessVideoFrame, THRESHOLDS } from '../lib/quality'
import { useScanRun } from '../scan/ScanRunner'

const samples = [
  { id: 'compliant', label: 'Compliant pack', hint: 'All mandatory declarations present' },
  { id: 'violation', label: 'Missing MRP & care details', hint: 'Two critical violations' },
  { id: 'blurry', label: 'Blurred photo', hint: 'Fails the quality gate' },
]

export default function Scan() {
  const nav = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const { startFromBlob, startFromVideo, startSample } = useScanRun()

  const [ready, setReady] = useState(false)
  const [camError, setCamError] = useState<string | null>(null)
  const [torch, setTorch] = useState(false)
  const [hasTorch, setHasTorch] = useState(false)
  const [sheet, setSheet] = useState(false)
  const [hint, setHint] = useState('Fill the frame with the label')
  const [live, setLive] = useState<'good' | 'warn'>('warn')

  useEffect(() => {
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
        const track = stream.getVideoTracks()[0]
        const caps = track.getCapabilities?.() as { torch?: boolean } | undefined
        setHasTorch(!!caps?.torch)
        setReady(true)
      })
      .catch((e: DOMException) => {
        setCamError(
          e.name === 'NotAllowedError'
            ? 'Camera permission was denied. You can still upload a photo or run a sample.'
            : 'No camera is available on this device. Upload a photo instead.',
        )
      })
    return () => {
      cancelled = true
      stopStream(streamRef.current)
    }
  }, [])

  // Live coaching from the same maths the gate uses.
  useEffect(() => {
    if (!ready) return
    const t = setInterval(() => {
      const v = videoRef.current
      if (!v) return
      const q = assessVideoFrame(v)
      if (!q) return
      if (q.luma < THRESHOLDS.lumaMin) {
        setHint('Too dark — find more light')
        setLive('warn')
      } else if (q.glare > THRESHOLDS.glareMax) {
        setHint('Glare detected — tilt the pack away from the light')
        setLive('warn')
      } else if (q.sharpness < THRESHOLDS.sharpnessMin * 0.6) {
        setHint('Hold steady — the image is blurred')
        setLive('warn')
      } else {
        setHint('Looks good — tap to capture')
        setLive('good')
      }
    }, 700)
    return () => clearInterval(t)
  }, [ready])

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    try {
      await track.applyConstraints({ advanced: [{ torch: !torch }] } as never)
      setTorch((t) => !t)
    } catch {
      /* torch unsupported */
    }
  }

  const capture = () => {
    const v = videoRef.current
    if (!v || !ready) return
    stopStream(streamRef.current)
    startFromVideo(v)
    nav('/app/processing')
  }

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    stopStream(streamRef.current)
    startFromBlob(f)
    nav('/app/processing')
  }

  const runSample = (id: string) => {
    stopStream(streamRef.current)
    startSample(id)
    nav('/app/processing')
  }

  return (
    <Screen className="bg-ink-900">
      <AppBar
        tone="dark"
        title="Scan label"
        right={
          <>
            {hasTorch && (
              <IconButton tone="dark" icon={torch ? Zap : ZapOff} label={torch ? 'Turn flash off' : 'Turn flash on'} onClick={toggleTorch} />
            )}
            <IconButton tone="dark" icon={X} label="Close scanner" onClick={() => nav('/app/home')} />
          </>
        }
      />

      <div className="relative flex-1 overflow-hidden bg-ink-900">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`absolute inset-0 h-full w-full object-cover ${ready ? 'opacity-100' : 'opacity-0'}`}
        />

        {camError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <CameraOff size={30} className="text-white/40" aria-hidden />
            <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-white/70">{camError}</p>
          </div>
        )}

        {/* framing reticle */}
        {!camError && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center px-9">
            <div className="relative aspect-[3/4] w-full max-w-[280px]">
              {[
                'left-0 top-0 border-l-[3px] border-t-[3px] rounded-tl-xl',
                'right-0 top-0 border-r-[3px] border-t-[3px] rounded-tr-xl',
                'left-0 bottom-0 border-l-[3px] border-b-[3px] rounded-bl-xl',
                'right-0 bottom-0 border-r-[3px] border-b-[3px] rounded-br-xl',
              ].map((c) => (
                <span
                  key={c}
                  aria-hidden
                  className={`absolute h-9 w-9 transition-colors duration-300 ${
                    live === 'good' ? 'border-brand-400' : 'border-white/55'
                  } ${c}`}
                />
              ))}
            </div>
          </div>
        )}

        <p
          aria-live="polite"
          className={`absolute inset-x-0 bottom-5 px-8 text-center text-sm font-medium transition-colors ${
            live === 'good' ? 'text-brand-300' : 'text-white/70'
          }`}
        >
          {ready ? hint : camError ? '' : 'Starting camera…'}
        </p>
      </div>

      {/* controls */}
      <div className="safe-b shrink-0 bg-ink-900 px-6 pb-4 pt-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="grid h-12 w-12 place-items-center rounded-xl text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Upload a photo instead"
          >
            <Upload size={21} strokeWidth={1.8} aria-hidden />
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onFile} className="sr-only" />

          <button
            type="button"
            onClick={capture}
            disabled={!ready}
            aria-label="Capture photo"
            className="grid h-[74px] w-[74px] place-items-center rounded-full ring-[3px] ring-white/85 transition-transform duration-150 ease-spring active:scale-90 disabled:opacity-35"
          >
            <span className="h-[58px] w-[58px] rounded-full bg-white" />
          </button>

          <button
            type="button"
            onClick={() => setSheet(true)}
            className="grid h-12 w-12 place-items-center rounded-xl text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Use a sample pack"
          >
            <Images size={21} strokeWidth={1.8} aria-hidden />
          </button>
        </div>

        <button
          type="button"
          onClick={() => nav('/app/guidelines')}
          className="mx-auto mt-3 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-white/55 transition-colors hover:text-white"
        >
          <HelpCircle size={13} aria-hidden />
          Scanning tips
        </button>
      </div>

      {sheet && (
        <>
          <button
            type="button"
            aria-label="Close sample picker"
            onClick={() => setSheet(false)}
            className="absolute inset-0 z-40 animate-fade-in bg-ink-900/60 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Sample packs"
            className="safe-b absolute inset-x-0 bottom-0 z-50 animate-fade-up rounded-t-2xl bg-surface px-5 pb-5 pt-3"
          >
            <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-ink-300" aria-hidden />
            <div className="mb-1 flex items-center gap-2">
              <Sparkles size={16} className="text-brand-600" aria-hidden />
              <h2 className="font-display text-md font-semibold">Sample packs</h2>
            </div>
            <p className="mb-4 text-sm text-ink-500">
              Runs the real pipeline — quality gate, OCR and rule engine — on a bundled image.
            </p>
            <ul className="space-y-2">
              {samples.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => runSample(s.id)}
                    className="card-interactive flex w-full items-center gap-3 p-3.5 text-left"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-md font-medium text-ink-900">{s.label}</span>
                      <span className="mt-0.5 block text-xs text-ink-500">{s.hint}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setSheet(false)} className="btn-ghost btn-block mt-3">
              Cancel
            </button>
          </div>
        </>
      )}
    </Screen>
  )
}
