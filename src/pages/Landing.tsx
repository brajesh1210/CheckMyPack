import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScanLine, ShieldCheck, WifiOff, Languages, ArrowRight, Download, Check } from 'lucide-react'
import { Screen, ScrollArea } from '../components/UI'
import { Wordmark, Mark } from '../components/Brand'

const features = [
  { icon: ScanLine, title: 'Scan any packet', body: 'Point your camera at the label. Results in under ten seconds.' },
  { icon: ShieldCheck, title: 'Cited verdicts', body: 'Every finding maps to a clause of LMPC 2011 or the FSSAI regulations.' },
  { icon: WifiOff, title: 'Works offline', body: 'On-device text extraction keeps the checker usable without a network.' },
  { icon: Languages, title: 'Hindi & English', body: 'Full interface translation plus spoken read-out of the verdict.' },
]

export default function Landing() {
  const nav = useNavigate()
  const [prompt, setPrompt] = useState<any>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const install = async () => {
    if (!prompt) {
      nav('/login')
      return
    }
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setPrompt(null)
  }

  return (
    <Screen>
      <ScrollArea>
        {/* ---------------------------------------------------------- hero */}
        <section className="relative overflow-hidden bg-brand-900 px-5 pb-10 pt-6 text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-brand-500/25 blur-3xl"
          />
          <div className="relative">
            <Wordmark size={30} tone="light" />

            <div className="mt-10 max-w-[22ch]">
              <p className="eyebrow text-brand-200">Legal Metrology · FSSAI</p>
              <h1 className="mt-2.5 font-display text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-white">
                Know what the label is hiding.
              </h1>
            </div>
            <p className="mt-4 max-w-[40ch] text-md leading-relaxed text-white/70">
              CheckMyPack reads a packaged product&apos;s declarations and checks them against Indian
              packaging law — then tells you exactly which rule was broken.
            </p>

            <div className="mt-7 flex flex-col gap-2.5">
              <button type="button" onClick={() => nav('/login')} className="btn-primary btn-block bg-white text-brand-800 hover:bg-brand-50">
                Start scanning
                <ArrowRight size={18} strokeWidth={2.2} aria-hidden />
              </button>
              <button
                type="button"
                onClick={install}
                className="btn btn-block border border-white/25 bg-white/5 text-white hover:bg-white/12"
              >
                {installed ? <Check size={18} aria-hidden /> : <Download size={18} strokeWidth={2} aria-hidden />}
                {installed ? 'Installed' : 'Install app'}
              </button>
            </div>

            <p className="mt-3.5 text-xs text-white/45">
              Free · No Play Store · Installs straight from the browser
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------ trust bar */}
        <div className="grid grid-cols-3 divide-x divide-ink-200 border-b border-ink-200 bg-surface">
          {[
            ['12', 'declarations checked'],
            ['< 10s', 'average verdict'],
            ['14404', 'helpline, one tap'],
          ].map(([v, l]) => (
            <div key={l} className="px-2 py-4 text-center">
              <div className="font-display text-lg font-semibold text-ink-900 tnum">{v}</div>
              <div className="mt-0.5 text-2xs leading-tight text-ink-500">{l}</div>
            </div>
          ))}
        </div>

        {/* ------------------------------------------------------- features */}
        <section className="gutter py-9">
          <p className="eyebrow">How it helps</p>
          <h2 className="mt-2 font-display text-2xl">Built for shoppers and inspectors alike.</h2>

          <ul className="stagger mt-6 space-y-2.5">
            {features.map(({ icon: Icon, title, body }) => (
              <li key={title} className="card flex gap-3.5 p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  <Icon size={19} strokeWidth={1.9} aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="text-md font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-500">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------------------------------------------------- steps */}
        <section className="gutter border-t border-ink-200 bg-surface py-9">
          <p className="eyebrow">The flow</p>
          <h2 className="mt-2 font-display text-2xl">Three steps, one verdict.</h2>
          <ol className="mt-6 space-y-0">
            {[
              ['Capture', 'A quality gate rejects blurred, dark or glared frames before anything is judged.'],
              ['Extract', 'Text is read on-device, or by a vision model when you are online.'],
              ['Adjudicate', 'A deterministic rule engine — never the AI — decides pass or violation.'],
            ].map(([t, b], i, arr) => (
              <li key={t} className="relative flex gap-4 pb-6 last:pb-0">
                {i < arr.length - 1 && (
                  <span aria-hidden className="absolute left-[15px] top-9 h-full w-px bg-ink-200" />
                )}
                <span className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-500 font-display text-sm font-semibold text-white tnum">
                  {i + 1}
                </span>
                <div className="pt-0.5">
                  <h3 className="text-md font-semibold">{t}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-500">{b}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-7 rounded-xl border border-brand-200 bg-brand-50 p-4">
            <p className="text-sm leading-relaxed text-brand-900">
              <strong className="font-semibold">The AI only reads. The rules decide.</strong> Extraction and
              judgement are deliberately separated, so a verdict can always be traced to a statute.
            </p>
          </div>
        </section>

        {/* --------------------------------------------------------- footer */}
        <footer className="gutter flex flex-col items-center gap-3 border-t border-ink-200 py-8 text-center">
          <Mark size={28} className="text-ink-300" />
          <p className="text-xs leading-relaxed text-ink-400">
            CheckMyPack · Smart India Hackathon SIH26034
            <br />
            Advisory tool. Not a substitute for official enforcement action.
          </p>
        </footer>
      </ScrollArea>
    </Screen>
  )
}
