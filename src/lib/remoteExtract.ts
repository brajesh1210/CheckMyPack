/**
 * Online extraction via the Supabase Edge Function.
 *
 * This is an accelerator, never a dependency. If the endpoint is unconfigured,
 * offline, slow, or returns anything unexpected, the caller silently falls back
 * to on-device Tesseract. The app must work with no network at all.
 */

import type { Fields } from './extract'

const ENDPOINT = import.meta.env.VITE_EXTRACT_URL as string | undefined
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const TIMEOUT_MS = 12_000

export function remoteConfigured(): boolean {
  return !!ENDPOINT
}

/** Keys the function returns that map onto engine fields. */
const FIELD_KEYS = [
  'mrp', 'net_qty', 'mfg_month_year', 'expiry', 'batch', 'manufacturer',
  'customer_care', 'phone', 'email', 'fssai_licence', 'fssai_logo',
  'veg_symbol', 'ingredients', 'nutrition', 'allergen', 'generic_name',
  'country_origin',
] as const

export interface RemoteResult {
  fields: Fields
  category: string | null
  rawText: string
  legibility: number
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(String(fr.result).replace(/^data:image\/\w+;base64,/, ''))
    fr.onerror = () => reject(fr.error)
    fr.readAsDataURL(blob)
  })
}

/**
 * Returns null on any failure — the caller treats null as "use the local
 * reader" rather than as an error to show the user.
 */
export async function remoteExtract(image: Blob): Promise<RemoteResult | null> {
  if (!ENDPOINT || !navigator.onLine) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const base64 = await blobToBase64(image)
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(ANON_KEY ? { Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY } : {}),
      },
      body: JSON.stringify({ image: base64, mimeType: image.type || 'image/jpeg' }),
    })

    if (!res.ok) return null

    const payload = (await res.json()) as {
      fields?: Record<string, unknown>
      error?: string
    }
    if (!payload.fields) return null

    const raw = payload.fields
    const legibility = typeof raw.legibility === 'number' ? raw.legibility : 0.8

    const fields: Fields = {}
    for (const key of FIELD_KEYS) {
      const v = raw[key]
      const value = typeof v === 'string' && v.trim() ? v.trim() : null
      fields[key] = { value, confidence: value ? legibility : 0 }
    }

    const cat = typeof raw.product_category === 'string' ? raw.product_category : null
    const category = cat === 'pan_masala' ? 'pan_masala' : null

    return {
      fields,
      category,
      rawText: typeof raw.raw_text === 'string' ? raw.raw_text : '',
      legibility,
    }
  } catch {
    // Abort, network failure, malformed JSON — all mean "fall back".
    return null
  } finally {
    clearTimeout(timer)
  }
}
