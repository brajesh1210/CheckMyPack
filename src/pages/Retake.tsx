import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Sun, Hand, Maximize, Camera, BookOpen, ScanSearch } from 'lucide-react'
import { Screen, ScrollArea, AppBar } from '../components/UI'
import { useApp } from '../store/app'
import { THRESHOLDS } from '../lib/quality'

const tips = [
  { icon: Sun, titleKey: 'guidelines.lightTitle', bodyKey: 'retake.lightBody' },
  { icon: Hand, titleKey: 'guidelines.steadyTitle', bodyKey: 'retake.steadyBody' },
  { icon: Maximize, titleKey: 'guidelines.frameTitle', bodyKey: 'retake.frameBody' },
]

export default function Retake() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { scans, lastScanId } = useApp()
  const scan = scans.find((s) => s.id === lastScanId)
  const q = scan?.quality

  const metrics = q
    ? [
        {
          label: 'Sharpness',
          pct: Math.max(0, Math.min(100, Math.round((q.sharpness / (THRESHOLDS.sharpnessMin * 2)) * 100))),
          ok: q.sharpness >= THRESHOLDS.sharpnessMin,
          note: q.sharpness >= THRESHOLDS.sharpnessMin ? t('retake.sharpOk') : t('retake.sharpBad'),
        },
        {
          label: 'Glare',
          pct: Math.round(q.glare * 100),
          ok: q.glare <= THRESHOLDS.glareMax,
          note: q.glare <= THRESHOLDS.glareMax ? t('retake.glareOk') : t('retake.glareBad', { pct: Math.round(THRESHOLDS.glareMax * 100) }),
        },
        {
          label: 'Brightness',
          pct: Math.round((q.luma / 255) * 100),
          ok: q.luma >= THRESHOLDS.lumaMin && q.luma <= THRESHOLDS.lumaMax,
          note: q.luma < THRESHOLDS.lumaMin ? t('retake.tooDark') : q.luma > THRESHOLDS.lumaMax ? t('retake.overexposed') : t('retake.inRange'),
        },
      ]
    : []

  return (
    <Screen>
      <AppBar back onBack={() => nav('/app/scan')} title={t('result.retake')} />

      <ScrollArea className="pb-6">
        <div className="gutter pt-4">
          <div className="flex items-start gap-3.5 rounded-xl bg-warn-soft p-4" role="status">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-warn-base text-white">
              <ScanSearch size={21} strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-lg font-semibold text-warn-text">{t('retake.heading')}</h1>
              <p className="mt-1 text-sm leading-relaxed text-warn-text/85">
                No verdict was issued. CheckMyPack never accuses a product on the basis of an
                unreadable photo.
              </p>
            </div>
          </div>
        </div>

        {q?.reasons?.length ? (
          <div className="gutter pt-5">
            <h2 className="eyebrow">{t('retake.whatWentWrong')}</h2>
            <ul className="mt-2.5 space-y-1.5">
              {q.reasons.map((r) => (
                <li key={r} className="flex gap-2 text-sm leading-relaxed text-ink-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-bad-base" aria-hidden />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {metrics.length > 0 && (
          <div className="gutter pt-6">
            <h2 className="eyebrow">{t('retake.qualityGate')}</h2>
            <div className="card mt-2.5 divide-y divide-ink-200 overflow-hidden">
              {metrics.map((m) => (
                <div key={m.label} className="px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium text-ink-900">{m.label}</span>
                    <span className={`text-xs font-semibold tnum ${m.ok ? 'text-ok-base' : 'text-bad-base'}`}>{m.pct}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100">
                    <div className={`h-full rounded-full ${m.ok ? 'bg-ok-base' : 'bg-bad-base'}`} style={{ width: `${m.pct}%` }} />
                  </div>
                  <p className="mt-1.5 text-xs text-ink-500">{m.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="gutter pt-7">
          <h2 className="font-display text-md font-semibold">{t('retake.howToFix')}</h2>
          <ul className="stagger mt-3 space-y-2.5">
            {tips.map(({ icon: Icon, titleKey, bodyKey }) => (
              <li key={titleKey} className="card flex gap-3.5 p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-100 text-ink-600">
                  <Icon size={17} strokeWidth={1.9} aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-ink-900">{t(titleKey)}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-500">{t(bodyKey)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </ScrollArea>

      <div className="safe-b gutter flex gap-2.5 border-t border-ink-200 bg-surface py-3.5">
        <button type="button" onClick={() => nav('/app/guidelines')} className="btn-secondary flex-1">
          <BookOpen size={17} strokeWidth={2} aria-hidden />
          {t('retake.guide')}
        </button>
        <button type="button" onClick={() => nav('/app/scan')} className="btn-primary flex-1">
          <Camera size={17} strokeWidth={2} aria-hidden />
          {t('retake.retakePhoto')}
        </button>
      </div>
    </Screen>
  )
}
