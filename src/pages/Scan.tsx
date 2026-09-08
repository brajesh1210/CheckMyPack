import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Zap, ZapOff, Images, HelpCircle, Sparkles } from 'lucide-react'
import { Screen, AppBar, IconButton } from '../components/UI'

const samples = [
  { id: 'pass', label: 'Compliant pack', hint: 'All 12 declarations present' },
  { id: 'violation', label: 'Missing MRP', hint: 'Two cited violations' },
  { id: 'retake', label: 'Glared photo', hint: 'Fails the quality gate' },
]

export default function Scan() {
  const nav = useNavigate()
  const [flash, setFlash] = useState(false)
  const [sheet, setSheet] = useState(false)

  return (
    <Screen className="bg-ink-900">
      <AppBar
        tone="dark"
        title="Scan label"
        right={
          <>
            <IconButton tone="dark" icon={flash ? Zap : ZapOff} label={flash ? 'Turn flash off' : 'Turn flash on'} onClick={() => setFlash((f) => !f)} />
            <IconButton tone="dark" icon={X} label="Close scanner" onClick={() => nav('/app/home')} />
          </>
        }
      />

      {/* --------------------------------------------------------- viewfinder */}
      <div className="relative flex-1 overflow-hidden bg-ink-900">
        {/* simulated camera feed */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 80% at 50% 35%, #3a4139 0%, #23271f 45%, #14180f 100%)',
          }}
        />

        {/* framing reticle */}
        <div className="absolute inset-0 grid place-items-center px-9">
          <div className="relative aspect-[3/4] w-full max-w-[280px]">
            {[
              'left-0 top-0 border-l-[3px] border-t-[3px] rounded-tl-xl',
              'right-0 top-0 border-r-[3px] border-t-[3px] rounded-tr-xl',
              'left-0 bottom-0 border-l-[3px] border-b-[3px] rounded-bl-xl',
              'right-0 bottom-0 border-r-[3px] border-b-[3px] rounded-br-xl',
            ].map((c) => (
              <span key={c} aria-hidden className={`absolute h-9 w-9 border-brand-400 ${c}`} />
            ))}
            <span
              aria-hidden
              className="absolute inset-x-2 top-2 h-0.5 animate-scan-line rounded-full bg-brand-400/70 shadow-[0_0_12px_2px_rgba(82,158,93,0.55)]"
            />
          </div>
        </div>

        {/* live guidance */}
        <p className="absolute inset-x-0 bottom-5 text-center text-sm font-medium text-white/70">
          Fill the frame with the label · hold steady
        </p>
      </div>

      {/* ------------------------------------------------------------ controls */}
      <div className="safe-b shrink-0 bg-ink-900 px-6 pb-4 pt-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSheet(true)}
            className="flex h-12 w-12 items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Use a sample pack"
          >
            <Images size={22} strokeWidth={1.8} aria-hidden />
          </button>

          <button
            type="button"
            onClick={() => nav('/app/processing?demo=pass')}
            aria-label="Capture photo"
            className="grid h-[74px] w-[74px] place-items-center rounded-full ring-[3px] ring-white/85 transition-transform duration-150 ease-spring active:scale-90"
          >
            <span className="h-[58px] w-[58px] rounded-full bg-white transition-colors" />
          </button>

          <button
            type="button"
            onClick={() => nav('/app/guidelines')}
            className="flex h-12 w-12 items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Scanning tips"
          >
            <HelpCircle size={22} strokeWidth={1.8} aria-hidden />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------- sample sheet */}
      {sheet && (
        <>
          <button
            type="button"
            aria-label="Close sample picker"
            onClick={() => setSheet(false)}
            className="absolute inset-0 z-40 bg-ink-900/60 backdrop-blur-sm animate-fade-in"
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
              <h2 className="font-display text-md font-semibold">Demo sample packs</h2>
            </div>
            <p className="mb-4 text-sm text-ink-500">Run the full pipeline without a camera.</p>

            <ul className="space-y-2">
              {samples.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => nav(`/app/processing?demo=${s.id}`)}
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
