import { useNavigate } from 'react-router-dom'
import { Camera, Sun, Hand, Maximize, Check, X } from 'lucide-react'
import { Screen, ScrollArea, AppBar } from '../components/UI'

const tips = [
  {
    icon: Sun,
    title: 'Light it evenly',
    good: 'Indirect daylight, or step under a ceiling light.',
    bad: 'Direct flash on glossy film — it blows out the print.',
  },
  {
    icon: Hand,
    title: 'Hold it steady',
    good: 'Brace your elbows and tap the shutter gently.',
    bad: 'Shooting one-handed while walking.',
  },
  {
    icon: Maximize,
    title: 'Fill the frame',
    good: 'The declaration panel should span most of the viewfinder.',
    bad: 'Standing back so the label is a small patch of pixels.',
  },
]

/** Small diagram illustrating a well-framed label vs a poorly framed one. */
function FrameDiagram({ good }: { good: boolean }) {
  return (
    <svg viewBox="0 0 84 60" className="h-[60px] w-[84px]" aria-hidden>
      <rect width="84" height="60" rx="6" fill={good ? '#E8F4E9' : '#FCEBEC'} />
      <rect
        x={good ? 16 : 32}
        y={good ? 10 : 20}
        width={good ? 52 : 22}
        height={good ? 40 : 18}
        rx="2.5"
        fill="#fff"
        stroke={good ? '#2E7D32' : '#C62828'}
        strokeWidth="1.6"
      />
      {(good ? [17, 23, 29, 35, 41] : [25, 29]).map((y) => (
        <rect
          key={y}
          x={good ? 21 : 35}
          y={y}
          width={good ? 34 : 15}
          height={good ? 3 : 1.6}
          rx="1"
          fill={good ? '#ADD5B2' : '#E5B4B4'}
        />
      ))}
    </svg>
  )
}

export default function Guidelines() {
  const nav = useNavigate()

  return (
    <Screen>
      <AppBar back title="Scanning guide" subtitle="Get a readable photo first time" />

      <ScrollArea className="pb-6">
        <div className="gutter pt-4">
          <p className="text-md leading-relaxed text-ink-600">
            The quality gate rejects any frame it cannot read reliably. Three habits get you a clean
            capture almost every time.
          </p>
        </div>

        {/* good vs bad */}
        <div className="gutter pt-6">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="card p-3.5">
              <FrameDiagram good />
              <div className="mt-2.5 flex items-center gap-1.5">
                <Check size={14} strokeWidth={3} className="text-ok-base" aria-hidden />
                <span className="text-sm font-semibold text-ok-text">Do this</span>
              </div>
              <p className="mt-1 text-xs leading-snug text-ink-500">Label square-on and filling the frame.</p>
            </div>
            <div className="card p-3.5">
              <FrameDiagram good={false} />
              <div className="mt-2.5 flex items-center gap-1.5">
                <X size={14} strokeWidth={3} className="text-bad-base" aria-hidden />
                <span className="text-sm font-semibold text-bad-text">Not this</span>
              </div>
              <p className="mt-1 text-xs leading-snug text-ink-500">Too far away and angled off-axis.</p>
            </div>
          </div>
        </div>

        {/* tips */}
        <div className="gutter pt-7">
          <ul className="stagger space-y-2.5">
            {tips.map(({ icon: Icon, title, good, bad }) => (
              <li key={title} className="card p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                    <Icon size={17} strokeWidth={1.9} aria-hidden />
                  </span>
                  <h2 className="text-md font-semibold text-ink-900">{title}</h2>
                </div>
                <div className="mt-3 space-y-2 pl-0.5">
                  <p className="flex gap-2 text-sm leading-relaxed text-ink-600">
                    <Check size={14} strokeWidth={3} className="mt-1 shrink-0 text-ok-base" aria-hidden />
                    {good}
                  </p>
                  <p className="flex gap-2 text-sm leading-relaxed text-ink-500">
                    <X size={14} strokeWidth={3} className="mt-1 shrink-0 text-bad-base" aria-hidden />
                    {bad}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="gutter pt-6">
          <div className="rounded-xl border border-ink-200 bg-ink-50 p-4">
            <p className="text-sm leading-relaxed text-ink-600">
              If a pack still will not read, photograph the declaration panel on its own rather than
              the whole product.
            </p>
          </div>
        </div>
      </ScrollArea>

      <div className="safe-b gutter border-t border-ink-200 bg-surface py-3.5">
        <button type="button" onClick={() => nav('/app/scan')} className="btn-primary btn-block">
          <Camera size={17} strokeWidth={2} aria-hidden />
          Start scanning
        </button>
      </div>
    </Screen>
  )
}
