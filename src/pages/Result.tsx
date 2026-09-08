import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ShieldCheck, TriangleAlert, Check, X, Volume2, Share2, FileText, ChevronRight, Scale, RotateCcw,
} from 'lucide-react'
import { Screen, ScrollArea, AppBar } from '../components/UI'
import { useApp } from '../store/app'

/** Bounding boxes are stated as percentages of the label image. */
const boxes = {
  pass: [
    { id: 'mrp', label: 'MRP', x: 8, y: 12, w: 38, h: 13, ok: true },
    { id: 'qty', label: 'Net qty', x: 54, y: 12, w: 36, h: 13, ok: true },
    { id: 'fssai', label: 'FSSAI', x: 8, y: 62, w: 46, h: 12, ok: true },
    { id: 'care', label: 'Consumer care', x: 8, y: 79, w: 62, h: 12, ok: true },
  ],
  violation: [
    { id: 'mrp', label: 'MRP missing', x: 8, y: 12, w: 38, h: 13, ok: false },
    { id: 'qty', label: 'Net qty', x: 54, y: 12, w: 36, h: 13, ok: true },
    { id: 'fssai', label: 'FSSAI', x: 8, y: 62, w: 46, h: 12, ok: true },
    { id: 'care', label: 'Care details missing', x: 8, y: 79, w: 62, h: 12, ok: false },
  ],
}

export default function Result() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const demo = (params.get('demo') === 'violation' ? 'violation' : 'pass') as 'pass' | 'violation'
  const scans = useApp((s) => s.scans)
  const [focused, setFocused] = useState<string | null>(null)
  const [speaking, setSpeaking] = useState(false)

  const scan = scans.find((s) => (demo === 'violation' ? s.state === 'VIOLATION' : s.state === 'PASS'))!
  const bad = demo === 'violation'
  const list = boxes[demo]

  const speak = () => {
    const text = bad
      ? `Violation found on ${scan.product}. ${scan.issues.length} declarations are missing. Grade ${scan.grade}.`
      : `${scan.product} is compliant. All required declarations are present. Grade ${scan.grade}.`
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.onend = () => setSpeaking(false)
      setSpeaking(true)
      window.speechSynthesis.speak(u)
    }
  }

  return (
    <Screen>
      <AppBar
        back
        onBack={() => nav('/app/home')}
        title="Scan result"
        subtitle={scan.id}
        right={
          <button
            type="button"
            onClick={speak}
            aria-label="Read the verdict aloud"
            aria-pressed={speaking}
            className={`grid h-11 w-11 place-items-center rounded-full transition-colors ${
              speaking ? 'bg-brand-100 text-brand-700' : 'text-ink-600 hover:bg-ink-100'
            }`}
          >
            <Volume2 size={19} strokeWidth={1.9} aria-hidden />
          </button>
        }
      />

      <ScrollArea className="pb-4">
        {/* ------------------------------------------------------- verdict */}
        <div className={`gutter py-6 ${bad ? 'bg-bad-soft' : 'bg-ok-soft'}`} role="status">
          <div className="flex items-start gap-3.5">
            <span
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${
                bad ? 'bg-bad-base' : 'bg-ok-base'
              } text-white`}
            >
              {bad ? <TriangleAlert size={24} strokeWidth={2} aria-hidden /> : <ShieldCheck size={24} strokeWidth={2} aria-hidden />}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className={`font-display text-2xl tracking-[-0.02em] ${bad ? 'text-bad-text' : 'text-ok-text'}`}>
                {bad ? 'Violation found' : 'Compliant'}
              </h1>
              <p className={`mt-1 text-sm leading-relaxed ${bad ? 'text-bad-text/80' : 'text-ok-text/80'}`}>
                {bad
                  ? `${scan.issues.length} required declarations are missing or improperly printed.`
                  : 'Every declaration required by law is present and legible.'}
              </p>
            </div>
            <div className="shrink-0 text-center">
              <div
                className={`grid h-12 w-12 place-items-center rounded-xl border-2 font-display text-xl font-bold ${
                  bad ? 'border-bad-base text-bad-base' : 'border-ok-base text-ok-base'
                }`}
                aria-label={`Compliance grade ${scan.grade}`}
              >
                {scan.grade}
              </div>
              <div className={`mt-1 text-2xs font-semibold uppercase tracking-wider ${bad ? 'text-bad-text/70' : 'text-ok-text/70'}`}>
                Grade
              </div>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-current/10 pt-4">
            {[
              ['Product', scan.product],
              ['Scanned', scan.date.split(',')[0]],
              ['Location', scan.place],
              ['Checks run', `${scan.items.length} declarations`],
            ].map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className={`text-2xs font-semibold uppercase tracking-[0.07em] ${bad ? 'text-bad-text/60' : 'text-ok-text/60'}`}>
                  {k}
                </dt>
                <dd className={`mt-0.5 truncate text-sm font-medium ${bad ? 'text-bad-text' : 'text-ok-text'}`}>{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* --------------------------------------------------- annotated label */}
        <section className="gutter pt-6">
          <h2 className="font-display text-md font-semibold">On the label</h2>
          <p className="mt-1 text-sm text-ink-500">Tap a box to jump to its check.</p>

          <div className="relative mt-3 aspect-[4/5] w-full overflow-hidden rounded-xl border border-ink-200 bg-gradient-to-b from-ink-100 to-ink-200">
            {/* stylised pack rendering */}
            <svg viewBox="0 0 100 125" className="absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="none">
              <rect x="4" y="4" width="92" height="117" rx="4" fill="#fff" />
              <rect x="4" y="4" width="92" height="26" rx="4" fill="#e8eae7" />
              {[36, 42, 48, 54, 92, 98, 104, 110].map((y) => (
                <rect key={y} x="10" y={y} width={y % 3 === 0 ? 62 : 76} height="2.6" rx="1.3" fill="#dcdfdb" />
              ))}
            </svg>

            {list.map((b) => {
              const active = focused === b.id
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setFocused(active ? null : b.id)}
                  aria-pressed={active}
                  aria-label={`${b.label}: ${b.ok ? 'passes' : 'fails'}`}
                  className="absolute rounded-md border-2 transition-all duration-200 ease-out"
                  style={{
                    left: `${b.x}%`,
                    top: `${b.y}%`,
                    width: `${b.w}%`,
                    height: `${b.h}%`,
                    borderColor: b.ok ? '#2E7D32' : '#C62828',
                    background: active
                      ? b.ok ? 'rgba(46,125,50,0.18)' : 'rgba(198,40,40,0.18)'
                      : b.ok ? 'rgba(46,125,50,0.07)' : 'rgba(198,40,40,0.09)',
                    boxShadow: active ? `0 0 0 3px ${b.ok ? 'rgba(46,125,50,0.25)' : 'rgba(198,40,40,0.25)'}` : 'none',
                  }}
                >
                  <span
                    className="absolute -top-0.5 left-0 -translate-y-full whitespace-nowrap rounded px-1.5 py-0.5 text-[9.5px] font-semibold text-white"
                    style={{ background: b.ok ? '#2E7D32' : '#C62828' }}
                  >
                    {b.label}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* ------------------------------------------------------- violations */}
        {bad && (
          <section className="gutter pt-7">
            <h2 className="font-display text-md font-semibold">Cited violations</h2>
            <ul className="mt-3 space-y-2.5">
              {scan.issues.map((iss) => (
                <li key={iss.title} className="rounded-xl border border-bad-soft bg-bad-soft/50 p-4">
                  <div className="flex items-start gap-2.5">
                    <X size={15} strokeWidth={3} className="mt-1 shrink-0 text-bad-base" aria-hidden />
                    <div className="min-w-0">
                      <h3 className="text-md font-semibold text-bad-text">{iss.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-ink-600">{iss.detail}</p>
                      <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-md bg-surface px-2 py-1 text-xs font-medium text-ink-700">
                        <Scale size={12} strokeWidth={2} className="text-ink-400" aria-hidden />
                        {iss.rule}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* -------------------------------------------------------- checklist */}
        <section className="gutter pt-7">
          <h2 className="font-display text-md font-semibold">Full checklist</h2>
          <ul className="mt-3 card divide-y divide-ink-200 overflow-hidden">
            {scan.items.map((it) => {
              const failed = it.status === 'fail'
              return (
                <li key={it.label} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                      failed ? 'bg-bad-soft text-bad-base' : 'bg-ok-soft text-ok-base'
                    }`}
                    aria-hidden
                  >
                    {failed ? <X size={13} strokeWidth={3} /> : <Check size={13} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink-900">{it.label}</span>
                    {it.rule && <span className="mt-0.5 block truncate text-xs text-ink-500">{it.rule}</span>}
                  </span>
                  <span className={`shrink-0 text-sm tnum ${failed ? 'font-semibold text-bad-text' : 'text-ink-600'}`}>
                    {it.value ?? (failed ? 'Not found' : '—')}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>

        {/* ---------------------------------------------------------- report */}
        <div className="gutter pt-5">
          <button type="button" onClick={() => nav('/app/report')} className="card-interactive flex w-full items-center gap-3 p-4 text-left">
            <FileText size={19} strokeWidth={1.9} className="shrink-0 text-ink-500" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block text-md font-medium text-ink-900">Detailed report</span>
              <span className="mt-0.5 block text-xs text-ink-500">Full declaration table with a verification QR</span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-ink-300" aria-hidden />
          </button>
        </div>
      </ScrollArea>

      {/* ------------------------------------------------------------ actions */}
      <div className="safe-b gutter flex gap-2.5 border-t border-ink-200 bg-surface py-3.5">
        <button type="button" onClick={() => nav('/app/scan')} className="btn-secondary" aria-label="Scan another pack">
          <RotateCcw size={17} strokeWidth={2} aria-hidden />
        </button>
        <button type="button" className="btn-secondary flex-1">
          <Share2 size={17} strokeWidth={2} aria-hidden />
          Share
        </button>
        {bad ? (
          <button type="button" onClick={() => nav('/app/complaint')} className="btn-danger flex-1">
            Report it
          </button>
        ) : (
          <button type="button" onClick={() => nav('/app/home')} className="btn-primary flex-1">
            Done
          </button>
        )}
      </div>
    </Screen>
  )
}
