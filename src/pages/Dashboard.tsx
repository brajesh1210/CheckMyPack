import { useNavigate } from 'react-router-dom'
import { Bell, ScanLine, ChevronRight, ShieldCheck, TriangleAlert, Layers, WifiOff, BookOpen, PhoneCall } from 'lucide-react'
import { Screen, ScrollArea, AppBar, IconButton, SectionHeader, Stat, StatusPill, EmptyState } from '../components/UI'
import BottomNav from '../components/BottomNav'
import { useApp } from '../store/app'

export default function Dashboard() {
  const nav = useNavigate()
  const { user, scans, online } = useApp()
  const total = scans.length
  const violations = scans.filter((s) => s.verdict === 'VIOLATION').length
  const compliant = total - violations
  const firstName = (user?.name || 'there').split(' ')[0]

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <Screen>
      <AppBar
        title={<span className="text-md font-semibold">{greeting}, {firstName}</span>}
        subtitle="Delhi, India"
        right={<IconButton icon={Bell} label="Notifications" badge={2} />}
      />

      <ScrollArea className="pb-6">
        {!online && (
          <div className="gutter pt-3">
            <div className="flex items-center gap-2.5 rounded-lg bg-warn-soft px-3 py-2.5" role="status">
              <WifiOff size={16} className="shrink-0 text-warn-base" aria-hidden />
              <p className="text-sm text-warn-text">Offline — scans use on-device reading and sync later.</p>
            </div>
          </div>
        )}

        {/* ------------------------------------------------- primary action */}
        <div className="gutter pt-4">
          <button
            type="button"
            onClick={() => nav('/app/scan')}
            className="group relative w-full overflow-hidden rounded-2xl bg-brand-800 p-5 text-left text-white shadow-md transition-all duration-200 ease-out hover:shadow-lg active:scale-[0.99]"
          >
            <span aria-hidden className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-brand-500/30 blur-2xl" />
            <span className="relative flex items-center gap-4">
              <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/12 ring-1 ring-white/20">
                <span aria-hidden className="absolute inset-0 animate-ring-pulse rounded-2xl bg-white/25" />
                <ScanLine size={26} strokeWidth={1.9} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-xl font-semibold tracking-[-0.02em]">Scan a packet</span>
                <span className="mt-1 block text-sm text-white/65">Check the label against LMPC &amp; FSSAI rules</span>
              </span>
              <ChevronRight size={20} className="shrink-0 text-white/50 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
            </span>
          </button>
        </div>

        {/* --------------------------------------------------------- stats */}
        <section className="gutter pt-5">
          <div className="grid grid-cols-3 gap-2.5">
            <Stat value={total} label="Total scans" icon={Layers} />
            <Stat value={compliant} label="Compliant" tone="ok" icon={ShieldCheck} />
            <Stat value={violations} label="Violations" tone="bad" icon={TriangleAlert} />
          </div>
        </section>

        {/* ------------------------------------------------- recent scans */}
        <section className="gutter pt-7">
          <SectionHeader title="Recent scans" action="View all" onAction={() => nav('/app/history')} />
          {scans.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={ScanLine}
                title="No scans yet"
                body="Scan your first packet to see its compliance verdict here."
                action={
                  <button type="button" onClick={() => nav('/app/scan')} className="btn-primary btn-sm">
                    Scan now
                  </button>
                }
              />
            </div>
          ) : (
            <ul className="stagger space-y-2.5">
              {scans.slice(0, 3).map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => nav(`/app/result/${s.id}`)}
                    className="card-interactive flex w-full items-center gap-3.5 p-3.5 text-left"
                  >
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${
                        s.verdict === 'VIOLATION' ? 'bg-bad-soft text-bad-base' : 'bg-ok-soft text-ok-base'
                      }`}
                    >
                      {s.verdict === 'VIOLATION' ? (
                        <TriangleAlert size={19} strokeWidth={1.9} aria-hidden />
                      ) : (
                        <ShieldCheck size={19} strokeWidth={1.9} aria-hidden />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-md font-medium text-ink-900">{s.productName}</span>
                      <span className="mt-0.5 block truncate text-xs text-ink-500 tnum">{new Date(s.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                    <StatusPill state={s.verdict} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ------------------------------------------------------ shortcuts */}
        <section className="gutter pt-7">
          <SectionHeader title="Quick actions" />
          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" onClick={() => nav('/app/guidelines')} className="card-interactive p-4 text-left">
              <BookOpen size={19} strokeWidth={1.9} className="mb-2.5 text-brand-600" aria-hidden />
              <span className="block text-sm font-semibold text-ink-900">Scanning guide</span>
              <span className="mt-1 block text-xs leading-snug text-ink-500">Get a readable photo first time</span>
            </button>
            <button type="button" onClick={() => nav('/app/complaint')} className="card-interactive p-4 text-left">
              <PhoneCall size={19} strokeWidth={1.9} className="mb-2.5 text-bad-base" aria-hidden />
              <span className="block text-sm font-semibold text-ink-900">File a complaint</span>
              <span className="mt-1 block text-xs leading-snug text-ink-500">National helpline 14404</span>
            </button>
          </div>
        </section>
      </ScrollArea>

      <BottomNav />
    </Screen>
  )
}
