import { useState } from 'react'
import { PhoneCall, MessageCircle, Send, Check, Loader2, Building2 } from 'lucide-react'
import { Screen, ScrollArea, AppBar } from '../components/UI'
import BottomNav from '../components/BottomNav'
import { useApp } from '../store/app'

export default function Complaint() {
  const scans = useApp((s) => s.scans)
  const violations = scans.filter((s) => s.state === 'VIOLATION')
  const [scanId, setScanId] = useState(violations[0]?.id ?? '')
  const [where, setWhere] = useState('')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle')
  const [err, setErr] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!where.trim()) {
      setErr('Tell us where you bought it — a shop name and locality is enough.')
      return
    }
    setErr('')
    setStatus('sending')
    setTimeout(() => setStatus('done'), 900)
  }

  if (status === 'done') {
    return (
      <Screen>
        <AppBar title="Complaint filed" />
        <ScrollArea className="gutter">
          <div className="flex flex-col items-center pt-14 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-ok-soft text-ok-base">
              <Check size={30} strokeWidth={2.4} aria-hidden />
            </span>
            <h2 className="mt-5 font-display text-2xl">Reference NCH-2026-4471</h2>
            <p className="mt-2 max-w-[38ch] text-md leading-relaxed text-ink-500">
              Your report has been queued for the National Consumer Helpline. You will receive an SMS
              once a grievance officer picks it up.
            </p>
            <button type="button" onClick={() => setStatus('idle')} className="btn-secondary mt-7">
              File another complaint
            </button>
          </div>
        </ScrollArea>
        <BottomNav />
      </Screen>
    )
  }

  return (
    <Screen>
      <AppBar title="Report a violation" subtitle="Escalate a non-compliant pack" />

      <ScrollArea className="gutter pb-6">
        {/* --------------------------------------------------- direct lines */}
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <a href="tel:14404" className="card-interactive flex flex-col p-4">
            <PhoneCall size={19} strokeWidth={1.9} className="mb-2.5 text-brand-600" aria-hidden />
            <span className="font-display text-lg font-semibold text-ink-900 tnum">14404</span>
            <span className="mt-0.5 text-xs leading-snug text-ink-500">National Consumer Helpline</span>
          </a>
          <a
            href="https://wa.me/918800001915"
            target="_blank"
            rel="noreferrer"
            className="card-interactive flex flex-col p-4"
          >
            <MessageCircle size={19} strokeWidth={1.9} className="mb-2.5 text-ok-base" aria-hidden />
            <span className="font-display text-lg font-semibold text-ink-900">WhatsApp</span>
            <span className="mt-0.5 text-xs leading-snug text-ink-500">Send the report as a chat</span>
          </a>
        </div>

        {/* ---------------------------------------------------------- form */}
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="scan" className="field-label">
              Attach a scan
            </label>
            <select id="scan" className="field" value={scanId} onChange={(e) => setScanId(e.target.value)}>
              {violations.length === 0 && <option value="">No violations recorded</option>}
              {violations.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.product} — {v.id}
                </option>
              ))}
            </select>
            <p className="field-hint">The cited rule list and annotated photo are attached automatically.</p>
          </div>

          <div>
            <label htmlFor="where" className="field-label">
              Where did you buy it?
            </label>
            <input
              id="where"
              className="field"
              placeholder="Shop name, locality"
              value={where}
              onChange={(e) => setWhere(e.target.value)}
              aria-invalid={!!err}
              aria-describedby={err ? 'where-err' : undefined}
            />
            {err && (
              <p id="where-err" role="alert" className="mt-1.5 text-xs font-medium text-bad-text">
                {err}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="note" className="field-label">
              Anything else? <span className="font-normal text-ink-400">(optional)</span>
            </label>
            <textarea
              id="note"
              rows={4}
              className="field resize-none py-3 leading-relaxed"
              placeholder="Describe what you noticed on the pack"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary btn-block" disabled={status === 'sending'}>
            {status === 'sending' ? (
              <Loader2 size={18} className="animate-spin" aria-hidden />
            ) : (
              <Send size={17} strokeWidth={2} aria-hidden />
            )}
            {status === 'sending' ? 'Submitting…' : 'Submit complaint'}
          </button>
        </form>

        <div className="mt-6 flex gap-3 rounded-xl border border-ink-200 bg-ink-50 p-4">
          <Building2 size={18} className="mt-0.5 shrink-0 text-ink-400" aria-hidden />
          <p className="text-xs leading-relaxed text-ink-500">
            Complaints are routed to the Department of Consumer Affairs. For weights and measures
            offences your state Legal Metrology department is the enforcing authority.
          </p>
        </div>
      </ScrollArea>

      <BottomNav />
    </Screen>
  )
}
