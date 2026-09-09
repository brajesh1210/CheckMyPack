/**
 * CheckMyPack — label extraction Edge Function.
 *
 * Accepts a base64 JPEG of a package label and returns the declarations it can
 * read, as structured JSON. It is deliberately a READER, not a judge: it never
 * decides compliance, never mentions rules, and never guesses a value that is
 * not visibly printed. The deterministic engine on the client turns these
 * fields into a verdict, so every outcome stays traceable to a statute.
 *
 * The Gemini API key lives only in Supabase secrets and is never shipped to a
 * device.
 *
 * Deploy:
 *   supabase secrets set GEMINI_API_KEY=...
 *   supabase functions deploy extract-label --no-verify-jwt
 *
 * Google retires model names on a few months' notice — gemini-2.0-flash was
 * switched off on 1 June 2026, which is why this function began returning 502.
 * So the model is read from a secret rather than being frozen in the code: if
 * the current one is retired again, set GEMINI_MODEL and redeploy, no edit
 * needed.
 */

/** Override with `supabase secrets set GEMINI_MODEL=...` when Google retires this one. */
const DEFAULT_MODEL = 'gemini-3.5-flash'
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || DEFAULT_MODEL
const MAX_IMAGE_BYTES = 1_500_000 // ~1.1 MB of base64; the client sends <500 KB

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * The response contract. Every field is either the exact text printed on the
 * pack, or null. `confidence` reflects legibility, not correctness.
 */
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    mrp: { type: 'string', nullable: true },
    net_qty: { type: 'string', nullable: true },
    mfg_month_year: { type: 'string', nullable: true },
    expiry: { type: 'string', nullable: true },
    batch: { type: 'string', nullable: true },
    manufacturer: { type: 'string', nullable: true },
    customer_care: { type: 'string', nullable: true },
    phone: { type: 'string', nullable: true },
    email: { type: 'string', nullable: true },
    fssai_licence: { type: 'string', nullable: true },
    fssai_logo: { type: 'string', nullable: true },
    veg_symbol: { type: 'string', nullable: true },
    ingredients: { type: 'string', nullable: true },
    nutrition: { type: 'string', nullable: true },
    allergen: { type: 'string', nullable: true },
    generic_name: { type: 'string', nullable: true },
    country_origin: { type: 'string', nullable: true },
    product_category: { type: 'string', nullable: true },
    raw_text: { type: 'string' },
    legibility: { type: 'number' },
  },
  required: ['raw_text', 'legibility'],
}

const SYSTEM_PROMPT = `You transcribe declarations from photographs of Indian packaged-goods labels.

Your only job is to report what is printed. You are not assessing compliance.

Rules you must follow:
- Copy values exactly as printed, including units and currency symbols. If the pack says "Net Wt. 200 g", return "200 g".
- If a declaration is not visible or not legible, return null for it. Never infer, never estimate, never fill in a plausible value.
- Do not mention laws, rules, violations, or whether something is missing. Just transcribe.
- For mrp, return only the numeric amount with its currency symbol, e.g. "₹45.00".
- For dates, return them as printed, e.g. "03/2026" or "Mar 2026".
- For fssai_licence, return only the 14-digit number.
- For fssai_logo, return "present" if the FSSAI mark or the word FSSAI appears, else null.
- For veg_symbol, return "veg" for the green mark, "non-veg" for the brown mark, else null.
- For product_category, return "pan_masala" only if the pack is pan masala, gutkha, or a similar chewing product. Otherwise return a short generic description such as "snack" or "dairy".
- raw_text must contain every piece of text you can read on the label, line by line.
- legibility is a number from 0 to 1 describing how clearly the label could be read overall.`

interface ExtractRequest {
  image: string // base64, with or without a data: prefix
  mimeType?: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  if (req.method !== 'POST') {
    return json({ error: 'Use POST.' }, 405)
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) {
    return json({ error: 'The extraction service is not configured.' }, 503)
  }

  let body: ExtractRequest
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Send a JSON body containing an image.' }, 400)
  }

  const base64 = (body.image ?? '').replace(/^data:image\/\w+;base64,/, '')
  if (!base64) return json({ error: 'No image was supplied.' }, 400)
  if (base64.length > MAX_IMAGE_BYTES) {
    return json({ error: 'That image is too large. Compress it before sending.' }, 413)
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            {
              role: 'user',
              parts: [
                { inlineData: { mimeType: body.mimeType ?? 'image/jpeg', data: base64 } },
                { text: 'Transcribe every declaration you can read on this label.' },
              ],
            },
          ],
          generationConfig: {
            temperature: 0, // transcription must be repeatable
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          ],
        }),
      },
    )

    if (!res.ok) {
      const detail = await res.text()
      console.error('Gemini request failed', res.status, detail.slice(0, 500))
      // 429/5xx are transient; the client should fall back to on-device OCR.
      return json({ error: 'The reading service is unavailable.', retryable: res.status >= 429 }, 502)
    }

    const payload = await res.json()
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      return json({ error: 'The label could not be read.', retryable: true }, 502)
    }

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(text)
    } catch {
      console.error('Model returned non-JSON', text.slice(0, 300))
      return json({ error: 'The label could not be read.', retryable: true }, 502)
    }

    return json({ source: 'gemini', model: GEMINI_MODEL, fields: parsed })
  } catch (e) {
    console.error('Unhandled extraction error', e)
    return json({ error: 'The reading service is unavailable.', retryable: true }, 502)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
