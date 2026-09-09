import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { PhoneCall, MessageCircle, Send, Check, Loader2, Building2 } from 'lucide-react'
import { Screen, ScrollArea, AppBar } from '../components/UI'
import BottomNav from '../components/BottomNav'
import { useApp } from '../store/app'
import { queueComplaint } from '../lib/sync'
import { backendConfigured } from '../lib/supabase'

export default function Complaint() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const scans = useApp((s) => s.scans)
  const violations = scans.filter((s) => s.verdict === 'VIOLATION')
  const [scanId, setScanId] = useState(params.get('scan') ?? violations[0]?.id ?? '')
  const [where, setWhere] = useState('')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle')
  const [err, setErr] = useState('')
  const [reference, setReference] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!where.trim()) {
      setErr(t('complaint.whereRequired'))
      return
    }
    setErr('')
    setStatus('sending')

    // The reference is generated locally so the user has something to quote
    // even when the complaint is still sitting in the offline queue.
    const ref = `CMP-C-${Date.now().toString(36).toUpperCase().slice(-6)}`

    const scan = scans.find((s) => s.id === scanId)
    const district = (scan?.place ?? '').split(',')[0]?.trim() || undefined

    queueComplaint({
      scanId: scanId || null,
      channel: 'in_app',
      notes: note.trim() || undefined,
      seller: where.trim(),
      district,
    })

    setReference(ref)
    setStatus('done')
  }

  if (status === 'done') {
    return (
      <Screen>
        <AppBar title={t('complaint.filed')} />
        <ScrollArea className="gutter">
          <div className="flex flex-col items-center pt-14 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-ok-soft text-ok-base">
              <Check size={30} strokeWidth={2.4} aria-hidden />
            </span>
            <h2 className="mt-5 font-display text-2xl">{t('complaint.reference', { ref: reference })}</h2>
            <p className="mt-2 max-w-[38ch] text-md leading-relaxed text-ink-500">
              {t(backendConfigured() ? 'complaint.recordedOnline' : 'complaint.recordedLocal')}
            </p>
            <p className="mt-3 max-w-[38ch] text-sm leading-relaxed text-ink-400">
              {t('complaint.helplineNote')}
            </p>
            <button
              type="button"
              onClick={() => {
                setStatus('idle')
                setWhere('')
                setNote('')
                setReference('')
              }}
              className="btn-secondary mt-7"
            >
              {t('complaint.fileAnother')}
            </button>
          </div>
        </ScrollArea>
        <BottomNav />
      </Screen>
    )
  }

  return (
    <Screen>
      <AppBar title={t('complaint.title')} subtitle={t('complaint.subtitle')} />

      <ScrollArea className="gutter pb-6">
        {/* --------------------------------------------------- direct lines */}
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <a href="tel:14404" className="card-interactive flex flex-col p-4">
            <PhoneCall size={19} strokeWidth={1.9} className="mb-2.5 text-brand-600" aria-hidden />
            <span className="font-display text-lg font-semibold text-ink-900 tnum">14404</span>
            <span className="mt-0.5 text-xs leading-snug text-ink-500">{t('complaint.helpline')}</span>
          </a>
          <a
            href="https://wa.me/918800001915"
            target="_blank"
            rel="noreferrer"
            className="card-interactive flex flex-col p-4"
          >
            <MessageCircle size={19} strokeWidth={1.9} className="mb-2.5 text-ok-base" aria-hidden />
            <span className="font-display text-lg font-semibold text-ink-900">{t('complaint.whatsapp')}</span>
            <span className="mt-0.5 text-xs leading-snug text-ink-500">{t('complaint.whatsappSub')}</span>
          </a>
        </div>

        {/* ---------------------------------------------------------- form */}
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="scan" className="field-label">
              {t('complaint.attachScan')}
            </label>
            <select id="scan" className="field" value={scanId} onChange={(e) => setScanId(e.target.value)}>
              {violations.length === 0 && <option value="">{t('complaint.noViolations')}</option>}
              {violations.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.productName} — {v.id}
                </option>
              ))}
            </select>
            <p className="field-hint">{t('complaint.attachNote')}</p>
          </div>

          <div>
            <label htmlFor="where" className="field-label">
              {t('complaint.whereLabel')}
            </label>
            <input
              id="where"
              className="field"
              placeholder={t('complaint.wherePlaceholder')}
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
              {t('complaint.noteLabel')} <span className="font-normal text-ink-400">(optional)</span>
            </label>
            <textarea
              id="note"
              rows={4}
              className="field resize-none py-3 leading-relaxed"
              placeholder={t('complaint.notePlaceholder')}
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
            {status === 'sending' ? 'Submitting…' : t('complaint.submitComplaint')}
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
