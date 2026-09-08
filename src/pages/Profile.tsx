import { useNavigate } from 'react-router-dom'
import {
  Languages, Volume2, WifiOff, BookOpen, ShieldCheck, Info, LogOut, ChevronRight, UserRound, Trash2,
} from 'lucide-react'
import { Screen, ScrollArea, AppBar, ListRow, SectionHeader } from '../components/UI'
import BottomNav from '../components/BottomNav'
import { useApp } from '../store/app'

export default function Profile() {
  const nav = useNavigate()
  const { user, role, lang, setLang, setUser, setRole, online, scans, voice, setVoice, clearScans } = useApp()

  const logout = () => {
    setUser(null)
    setRole(null)
    nav('/')
  }

  const initials = (user?.name || 'Guest')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <Screen>
      <AppBar title="Profile" />

      <ScrollArea className="pb-6">
        {/* -------------------------------------------------------- identity */}
        <div className="gutter pt-4">
          <div className="card flex items-center gap-4 p-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-500 font-display text-lg font-semibold text-white">
              {initials || <UserRound size={22} aria-hidden />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg font-semibold text-ink-900">{user?.name || 'Guest user'}</p>
              <p className="truncate text-sm text-ink-500">{user?.email || 'Not signed in'}</p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-ink-100 px-2 py-1 text-2xs font-semibold uppercase tracking-[0.06em] text-ink-600">
                {role || 'consumer'}
              </span>
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <div className="card px-3.5 py-3">
              <div className="font-display text-xl font-semibold tnum">{scans.length}</div>
              <div className="mt-0.5 text-xs text-ink-500">Scans saved</div>
            </div>
            <div className="card px-3.5 py-3">
              <div className={`font-display text-xl font-semibold ${online ? 'text-ok-base' : 'text-warn-base'}`}>
                {online ? 'Online' : 'Offline'}
              </div>
              <div className="mt-0.5 text-xs text-ink-500">Sync status</div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------- language */}
        <section className="gutter pt-7">
          <SectionHeader title="Language" />
          <div className="card overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-100 text-ink-600">
                <Languages size={17} strokeWidth={1.9} aria-hidden />
              </span>
              <span className="flex-1 text-md font-medium text-ink-900">Interface language</span>
              <div className="flex rounded-lg bg-ink-100 p-0.5" role="group" aria-label="Language">
                {(['en', 'hi'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLang(l)}
                    aria-pressed={lang === l}
                    className={`min-h-[34px] rounded-md px-3 text-sm font-semibold transition-colors ${
                      lang === l ? 'bg-surface text-ink-900 shadow-xs' : 'text-ink-500 hover:text-ink-800'
                    }`}
                  >
                    {l === 'en' ? 'EN' : 'हिं'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ preferences */}
        <section className="gutter pt-7">
          <SectionHeader title="Preferences" />
          <div className="card divide-y divide-ink-200 overflow-hidden">
            <ListRow
              icon={Volume2}
              title="Voice read-out"
              meta="Speak the verdict aloud after each scan"
              onClick={() => setVoice(!voice)}
              right={<Toggle on={voice} />}
            />
            <ListRow icon={WifiOff} title="On-device reading" meta="Labels are always read locally; nothing is uploaded" right={<Toggle on />} />
          </div>
        </section>

        {/* ---------------------------------------------------------- more */}
        <section className="gutter pt-7">
          <SectionHeader title="About" />
          <div className="card divide-y divide-ink-200 overflow-hidden">
            <ListRow
              icon={BookOpen}
              title="Scanning guide"
              onClick={() => nav('/app/guidelines')}
              right={<ChevronRight size={17} className="text-ink-300" aria-hidden />}
            />
            <ListRow
              icon={ShieldCheck}
              title="Rules & citations"
              meta="LMPC 2011 · FSSAI · GSR 881(E) 2025"
              right={<ChevronRight size={17} className="text-ink-300" aria-hidden />}
            />
            <ListRow icon={Info} title="Version" meta="CheckMyPack 1.0 · SIH26034" />
          </div>
        </section>

        <div className="gutter pt-5">
          <button
            type="button"
            onClick={() => { if (confirm('Delete all stored scans? This cannot be undone.')) clearScans() }}
            className="btn-secondary btn-block"
          >
            <Trash2 size={17} strokeWidth={2} aria-hidden />
            Clear scan history
          </button>
          <button type="button" onClick={logout} className="btn-secondary btn-block mt-2.5 text-bad-text hover:border-bad-soft hover:bg-bad-soft">
            <LogOut size={17} strokeWidth={2} aria-hidden />
            Sign out
          </button>
        </div>
      </ScrollArea>

      <BottomNav />
    </Screen>
  )
}

function Toggle({ on }: { on?: boolean }) {
  return (
    <span
      className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${
        on ? 'bg-brand-500' : 'bg-ink-300'
      }`}
      role="switch"
      aria-checked={!!on}
      aria-label="Toggle"
    >
      <span className={`h-5 w-5 rounded-full bg-white shadow-xs transition-transform ${on ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
    </span>
  )
}
