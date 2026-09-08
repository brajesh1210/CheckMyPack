import { useNavigate } from 'react-router-dom'
import { Sun, Hand, Maximize, Camera, BookOpen, ScanSearch } from 'lucide-react'
import { Screen, ScrollArea, AppBar } from '../components/UI'

const reasons = [
  { icon: Sun, title: 'Glare across the label', body: 'A bright reflection covered part of the printed text. Tilt the pack away from the light source.' },
  { icon: Hand, title: 'Slight motion blur', body: 'Rest your elbows on a surface, or brace the pack against something solid.' },
  { icon: Maximize, title: 'Label not fully in frame', body: 'Move closer until the declaration panel fills most of the viewfinder.' },
]

export default function Retake() {
  const nav = useNavigate()

  return (
    <Screen>
      <AppBar back onBack={() => nav('/app/scan')} title="Retake needed" />

      <ScrollArea className="pb-6">
        <div className="gutter pt-4">
          <div className="flex items-start gap-3.5 rounded-xl bg-warn-soft p-4" role="status">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-warn-base text-white">
              <ScanSearch size={21} strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-lg font-semibold text-warn-text">We could not read this label</h1>
              <p className="mt-1 text-sm leading-relaxed text-warn-text/85">
                No verdict was issued. CheckMyPack will never accuse a product based on an unreadable
                photo — so please take another one.
              </p>
            </div>
          </div>
        </div>

        {/* quality readout */}
        <div className="gutter pt-5">
          <h2 className="eyebrow">Quality gate</h2>
          <div className="mt-2.5 card divide-y divide-ink-200 overflow-hidden">
            {[
              ['Sharpness', 41, 'Below the 120 threshold', false],
              ['Glare', 34, 'Above the 22% limit', false],
              ['Brightness', 88, 'Within range', true],
            ].map(([label, val, note, ok]) => (
              <div key={label as string} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium text-ink-900">{label as string}</span>
                  <span className={`text-xs font-semibold tnum ${ok ? 'text-ok-base' : 'text-bad-base'}`}>
                    {val as number}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className={`h-full rounded-full ${ok ? 'bg-ok-base' : 'bg-bad-base'}`}
                    style={{ width: `${val as number}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-ink-500">{note as string}</p>
              </div>
            ))}
          </div>
        </div>

        {/* how to fix */}
        <div className="gutter pt-7">
          <h2 className="font-display text-md font-semibold">How to fix it</h2>
          <ul className="stagger mt-3 space-y-2.5">
            {reasons.map(({ icon: Icon, title, body }) => (
              <li key={title} className="card flex gap-3.5 p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-100 text-ink-600">
                  <Icon size={17} strokeWidth={1.9} aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-500">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </ScrollArea>

      <div className="safe-b gutter flex gap-2.5 border-t border-ink-200 bg-surface py-3.5">
        <button type="button" onClick={() => nav('/app/guidelines')} className="btn-secondary flex-1">
          <BookOpen size={17} strokeWidth={2} aria-hidden />
          Guide
        </button>
        <button type="button" onClick={() => nav('/app/scan')} className="btn-primary flex-1">
          <Camera size={17} strokeWidth={2} aria-hidden />
          Retake photo
        </button>
      </div>
    </Screen>
  )
}
