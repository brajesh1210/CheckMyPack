/**
 * Offline-first sync.
 *
 * A scan is always saved locally first and shown to the user immediately.
 * Uploading is a background courtesy that may fail, retry, or never happen —
 * the user must never wait on it and must never see it break.
 *
 * The queue survives restarts in local storage, retries with exponential
 * backoff, and gives up permanently only on errors that retrying cannot fix
 * (a rejected row, a policy violation). Rows are keyed by the client-generated
 * scan id, so a retry after an ambiguous failure cannot create a duplicate.
 */

import type { StoredScan } from '../store/app'
import { getSupabase, backendConfigured, currentUserId } from './supabase'

const QUEUE_KEY = 'cmp.syncQueue.v1'
const MAX_ATTEMPTS = 5
const BASE_DELAY_MS = 2_000

type Kind = 'scan' | 'complaint'

interface QueueItem {
  kind: Kind
  key: string // scan id, or a uuid for complaints
  payload: Record<string, unknown>
  attempts: number
  nextAttemptAt: number
  lastError?: string
}

/* ─────────────────────────────────────────────── queue persistence */

function readQueue(): QueueItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? (JSON.parse(raw) as QueueItem[]) : []
  } catch {
    return []
  }
}

function writeQueue(items: QueueItem[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items))
  } catch {
    // Storage full or blocked. Losing the queue is acceptable; losing the scan
    // is not, and that lives in the Zustand store.
  }
}

export function pendingCount(): number {
  return readQueue().length
}

function enqueue(item: Omit<QueueItem, 'attempts' | 'nextAttemptAt'>) {
  const q = readQueue()
  // Replace any existing entry for the same key rather than queueing twice.
  const next = q.filter((i) => !(i.kind === item.kind && i.key === item.key))
  next.push({ ...item, attempts: 0, nextAttemptAt: Date.now() })
  writeQueue(next)
}

/* ──────────────────────────────────────────────── payload shaping */

/**
 * Coarsens a location to district level. We need heat-maps, not the ability to
 * work out which shop an individual visited.
 */
function coarseLocation(place: string) {
  const [district, state] = place.split(',').map((s) => s.trim())
  return { district: district || null, state: state || null }
}

export function scanToRow(scan: StoredScan, userId: string, rulesVersion: string) {
  const { district, state } = coarseLocation(scan.place)
  return {
    id: scan.id,
    user_id: userId,
    scanned_at: scan.createdAt,
    product_name: scan.productName,
    barcode: scan.barcode,
    brand: scan.productName.split(/\s+/).slice(0, 2).join(' ') || null,
    verdict: scan.verdict,
    grade: scan.grade,
    score: scan.score,
    expired: scan.expired,
    reader: scan.reader,
    rules_version: rulesVersion,
    // The image itself is never uploaded: it may show a person, a shop front,
    // or a bill. Only the machine-readable evidence goes up.
    findings: scan.findings,
    quality: scan.quality,
    district,
    state,
  }
}

/* ───────────────────────────────────────────────── public surface */

/** Queue a scan for upload. Safe to call when offline or unconfigured. */
export function queueScan(scan: StoredScan, rulesVersion: string) {
  if (!backendConfigured()) return
  if (scan.verdict === 'RETAKE') return // nothing was read; nothing to report
  enqueue({ kind: 'scan', key: scan.id, payload: { scan, rulesVersion } })
  void flush()
}

export function queueComplaint(complaint: {
  scanId: string | null
  channel: 'in_app' | 'whatsapp' | 'helpline_14404'
  notes?: string
  seller?: string
  district?: string
}) {
  if (!backendConfigured()) return
  const key = `${complaint.scanId ?? 'none'}-${complaint.channel}-${Date.now()}`
  enqueue({ kind: 'complaint', key, payload: complaint })
  void flush()
}

/** Permanent failures: retrying will never succeed, so stop wasting attempts. */
function isPermanent(code: string | undefined): boolean {
  if (!code) return false
  return (
    code === '23514' || // check constraint violation — malformed payload
    code === '42501' || // RLS denied
    code === '22P02' // invalid text representation
  )
}

let inFlight: Promise<number> | null = null

/**
 * Drains the queue. Returns how many items were successfully sent. Never
 * throws — callers treat sync as best-effort.
 *
 * Concurrent callers share one run. queueScan fires a flush without awaiting
 * it, so a caller that does await must join that same run rather than start a
 * second one — otherwise both would read the queue, both would send, and the
 * backend would see duplicate work. The guard is therefore assigned
 * synchronously, before the first await.
 */
export function flush(): Promise<number> {
  if (inFlight) return inFlight
  if (!backendConfigured() || !navigator.onLine) return Promise.resolve(0)

  inFlight = drain().finally(() => {
    inFlight = null
  })
  return inFlight
}

async function drain(): Promise<number> {
  const sb = await getSupabase()
  if (!sb) return 0

  const userId = await currentUserId()
  if (!userId) return 0 // guest — nothing syncs until they sign in

  let sent = 0

  {
    let queue = readQueue()
    const now = Date.now()
    const due = queue.filter((i) => i.nextAttemptAt <= now)

    for (const item of due) {
      let ok = false
      let permanent = false
      let message = ''

      try {
        if (item.kind === 'scan') {
          const { scan, rulesVersion } = item.payload as {
            scan: StoredScan
            rulesVersion: string
          }
          // upsert, not insert: an ambiguous timeout must not duplicate a row.
          const { error } = await sb
            .from('scans')
            .upsert(scanToRow(scan, userId, rulesVersion), { onConflict: 'id' })
          if (error) {
            message = error.message
            permanent = isPermanent(error.code)
          } else ok = true
        } else {
          const c = item.payload as Record<string, unknown>
          const { error } = await sb.from('complaints').insert({
            scan_id: c.scanId ?? null,
            user_id: userId,
            channel: c.channel,
            notes: c.notes ?? null,
            seller: c.seller ?? null,
            district: c.district ?? null,
          })
          if (error) {
            message = error.message
            permanent = isPermanent(error.code)
          } else ok = true
        }
      } catch (e) {
        message = e instanceof Error ? e.message : 'network error'
      }

      queue = readQueue() // re-read: another tab may have changed it
      const idx = queue.findIndex((i) => i.kind === item.kind && i.key === item.key)
      if (idx === -1) continue

      if (ok) {
        queue.splice(idx, 1)
        sent++
      } else {
        const attempts = queue[idx].attempts + 1
        if (permanent || attempts >= MAX_ATTEMPTS) {
          console.warn(`Dropping ${item.kind} ${item.key} after ${attempts}: ${message}`)
          queue.splice(idx, 1)
        } else {
          queue[idx] = {
            ...queue[idx],
            attempts,
            lastError: message,
            // 2s, 4s, 8s, 16s — plus jitter so retries do not synchronise.
            nextAttemptAt: Date.now() + BASE_DELAY_MS * 2 ** (attempts - 1) + Math.random() * 1000,
          }
        }
      }
      writeQueue(queue)
    }
  }

  return sent
}

/**
 * Flush when the app starts and whenever connectivity returns. Idempotent:
 * calling it twice does not attach duplicate listeners.
 */
let started = false
export function startSync() {
  if (started || !backendConfigured()) return
  started = true

  void flush()
  window.addEventListener('online', () => void flush())
  // Catch items whose backoff expired while the app sat idle.
  setInterval(() => void flush(), 60_000)
}
