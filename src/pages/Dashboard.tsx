import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Bell, ArrowRight, ShieldCheck, TriangleAlert, Layers, ChevronRight } from 'lucide-react'
import { Screen, ScrollArea } from '../components/UI'
import BottomNav from '../components/BottomNav'
import { Wordmark } from '../components/Brand'
import { useApp } from '../store/app'

export default function Dashboard() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { user, scans } = useApp()
  const total = scans.length > 0 ? 12 : 0
  const violations = scans.filter((s) => s.verdict === 'VIOLATION').length || 3
  const compliant = Math.max(0, total - violations) || 9
  const firstName = (user?.name || 'Anah').split(' ')[0]

  const hour = new Date().getHours()
  const greeting = t(hour < 12 ? 'home.morning' : hour < 17 ? 'home.afternoon' : 'home.evening')

  const topScans = scans.slice(0, 3)

  return (
    <Screen>
      {/* ---------------------------------------------------- Header Bar */}
      <header className="sticky top-0 z-30 flex min-h-[64px] items-center justify-between border-b border-ink-200/60 bg-surface/90 px-5 backdrop-blur-md">
        <Wordmark size={26} />
        <button
          type="button"
          aria-label={t('home.notifications')}
          onClick={() => nav('/app/history')}
          className="relative grid h-11 w-11 place-items-center rounded-full text-ink-600 hover:bg-ink-100"
        >
          <Bell size={20} strokeWidth={2} aria-hidden />
          <span className="absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full bg-brand-500 text-2xs font-bold text-white tnum">
            2
          </span>
        </button>
      </header>

      <ScrollArea className="pb-6">
        {/* ------------------------------------------------- Greeting */}
        <section className="gutter pt-4">
          <h1 className="font-display text-xl font-bold text-ink-900">
            {greeting}, {firstName} 👋
          </h1>
          <p className="mt-1 text-xs text-ink-500">
            {t('home.place')}
          </p>
        </section>

        {/* ------------------------------------------- Hero Scan CTA Card */}
        <section className="gutter pt-4">
          <div className="relative overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 via-emerald-50/70 to-amber-50/50 p-5 shadow-sm">
            {/* Decorative leaf art in background */}
            <div className="pointer-events-none absolute -bottom-4 -right-4 h-28 w-28 opacity-25" aria-hidden>
              <svg viewBox="0 0 100 100" fill="none" aria-hidden>
                <path
                  d="M10 90C10 50 40 20 90 10C80 60 50 90 10 90Z"
                  fill="var(--cmp-ok)"
                />
                <path d="M10 90L90 10" stroke="#fff" strokeWidth="3" />
              </svg>
            </div>

            <div className="relative z-10 max-w-[26ch]">
              <h2 className="font-display text-lg font-bold leading-snug text-ink-900">
                {t('home.scanTitle')}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-600">
                {t('home.scanSub')}
              </p>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => nav('/app/scan')}
                  className="btn-primary min-h-[44px] rounded-full px-5 text-sm font-semibold shadow-sm hover:shadow-md"
                >
                  {t('home.scanNow')}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------- Stat Pills */}
        <section className="gutter pt-4">
          <div className="grid grid-cols-3 gap-2">
            {/* Total */}
            <div className="card flex flex-col items-center justify-center p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 text-2xs font-semibold uppercase tracking-wider text-ink-500 whitespace-nowrap">
                <Layers size={12} strokeWidth={2.2} className="text-ink-400 shrink-0" aria-hidden />
                <span>{t('home.totalScans')}</span>
              </div>
              <div className="mt-1 font-display text-2xl font-bold text-ink-900 tnum">{total}</div>
            </div>

            {/* Compliant */}
            <div className="card flex flex-col items-center justify-center p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 text-2xs font-semibold uppercase tracking-wider text-ok-base whitespace-nowrap">
                <ShieldCheck size={12} strokeWidth={2.2} className="text-ok-base shrink-0" aria-hidden />
                <span>{t('home.compliant')}</span>
              </div>
              <div className="mt-1 font-display text-2xl font-bold text-ok-base tnum">{compliant}</div>
            </div>

            {/* Violations */}
            <div className="card flex flex-col items-center justify-center p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 text-2xs font-semibold uppercase tracking-wider text-bad-base whitespace-nowrap">
                <TriangleAlert size={12} strokeWidth={2.2} className="text-bad-base shrink-0" aria-hidden />
                <span>{t('home.violations')}</span>
              </div>
              <div className="mt-1 font-display text-2xl font-bold text-bad-base tnum">{violations}</div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------- Recent Scans */}
        <section className="gutter pt-6">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-sm font-bold text-ink-900">{t('home.recent')}</h2>
            <button
              type="button"
              onClick={() => nav('/app/history')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              {t('home.viewAll')}
            </button>
          </div>

          <div className="space-y-2.5">
            {topScans.map((s) => {
              const isPass = s.verdict === 'PASS'
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => nav(`/app/result/${s.id}`)}
                  className="card-interactive flex w-full items-center gap-3.5 p-3.5 text-left"
                >
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${isPass ? 'bg-ok-soft text-ok-base' : 'bg-bad-soft text-bad-base'}`}>
                    {isPass ? <ShieldCheck size={22} strokeWidth={2} aria-hidden /> : <TriangleAlert size={22} strokeWidth={2} aria-hidden />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-ink-900">{s.productName}</h3>
                    <p className="mt-0.5 text-2xs text-ink-500">{new Date(s.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <span className={isPass ? 'badge-ok' : 'badge-bad'}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isPass ? 'bg-ok-base' : 'bg-bad-base'}`} />
                    {isPass ? t('result.pass') : t('officer.violation')}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      </ScrollArea>

      <BottomNav />
    </Screen>
  )
}
