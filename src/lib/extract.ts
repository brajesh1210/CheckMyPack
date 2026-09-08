/**
 * Turn raw OCR text into structured label declarations.
 *
 * This layer only READS. It never decides compliance — that is the rule
 * engine's job, so a verdict can always be traced back to a statute.
 */

import type { OcrResult, OcrWord } from './ocr'

export interface FieldValue {
  value: string | null
  confidence: number
  /** Bounding box in 0..100 percentages of the image, if located. */
  box?: { x: number; y: number; w: number; h: number }
}

export type Fields = Record<string, FieldValue>

/** Normalise common OCR confusions before matching. */
export function normalise(raw: string): string {
  return raw
    .replace(/\r/g, '')
    .replace(/[|]/g, 'I')
    // Word-boundary anchored so 'WAFERS' is not mangled into 'WAFE₹'.
    .replace(/\u20b9|\bRs\.?(?=\s|\d|$)|\bINR\b/gi, '₹')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

/** Locate the words that produced a match so we can draw a box on the label. */
function locate(words: OcrWord[], needle: string, imgW: number, imgH: number) {
  if (!needle || !words.length || !imgW || !imgH) return undefined
  const target = needle.toLowerCase().replace(/\s+/g, '')
  if (!target) return undefined

  const hits = words.filter((w) => {
    const t = w.text.toLowerCase().replace(/[^a-z0-9₹./@-]/g, '')
    return t.length > 1 && (target.includes(t) || t.includes(target.slice(0, 6)))
  })
  if (!hits.length) return undefined

  const x0 = Math.min(...hits.map((h) => h.bbox.x0))
  const y0 = Math.min(...hits.map((h) => h.bbox.y0))
  const x1 = Math.max(...hits.map((h) => h.bbox.x1))
  const y1 = Math.max(...hits.map((h) => h.bbox.y1))

  return {
    x: (x0 / imgW) * 100,
    y: (y0 / imgH) * 100,
    w: ((x1 - x0) / imgW) * 100,
    h: ((y1 - y0) / imgH) * 100,
  }
}

type Matcher = { re: RegExp; group?: number }

const MATCHERS: Record<string, Matcher[]> = {
  mrp: [
    { re: /(?:m\.?r\.?p\.?|maximum\s+retail\s+price|retail\s+sale\s+price|rsp)[^0-9₹]{0,18}₹?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i, group: 1 },
    { re: /₹\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)\s*(?:\/-)?\s*(?:incl|only)?/i, group: 1 },
  ],
  net_qty: [
    { re: /(?:net\s*(?:wt\.?|weight|qty\.?|quantity|content|vol\.?|volume))[^0-9]{0,14}([0-9]+(?:\.[0-9]+)?\s*(?:kg|g|gm|gms|mg|ml|l|ltr|litre|liter|pcs|pieces?|n)\b)/i, group: 1 },
    { re: /\b([0-9]+(?:\.[0-9]+)?\s*(?:kg|gm?s?|ml|ltr?|litres?)\b)/i, group: 1 },
  ],
  mfg_month_year: [
    { re: /(?:mfg\.?|mfd\.?|manufactur\w*|packed?(?:\s+on)?|pkd\.?|date\s+of\s+(?:mfg|manufacture|packing))[^a-z0-9]{0,12}((?:[0-3]?[0-9][/\-.])?(?:[01]?[0-9]|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[/\-. ]{1,2}(?:20)?[0-9]{2})/i, group: 1 },
  ],
  expiry: [
    { re: /(?:exp(?:iry|ires?)?\.?(?:\s*date)?|use\s*by|best\s*before|bb\.?e?|consume\s+before)[^a-z0-9]{0,16}((?:[0-3]?[0-9][/\-.])?(?:[01]?[0-9]|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[/\-. ]{1,2}(?:20)?[0-9]{2})/i, group: 1 },
    { re: /best\s*before\s*([0-9]+\s*(?:months?|days?|years?))/i, group: 1 },
  ],
  batch: [
    { re: /(?:batch|lot|b\.?no\.?|batch\s*(?:no|code))[^a-z0-9]{0,10}([a-z0-9][a-z0-9\-/]{2,14})/i, group: 1 },
  ],
  fssai_licence: [
    { re: /(?:fssai|lic(?:ence|ense)?\s*(?:no\.?)?)[^0-9]{0,14}([0-9]{14})/i, group: 1 },
    { re: /\b([0-9]{14})\b/, group: 1 },
  ],
  fssai_logo: [{ re: /\bfssai\b/i }],
  veg_symbol: [
    { re: /\b(veg(?:etarian)?|non[\s-]?veg(?:etarian)?|pure\s+veg)\b/i, group: 1 },
  ],
  ingredients: [
    { re: /\bingredients?\b\s*[:\-]?\s*(.{0,90})/i, group: 1 },
  ],
  manufacturer: [
    { re: /(?:manufactured?\s+(?:&|and)?\s*(?:packed\s+)?by|mfd\.?\s+by|marketed\s+by|packed\s+by)\s*[:\-]?\s*(.{4,90})/i, group: 1 },
  ],
  customer_care: [
    { re: /(?:customer\s+care|consumer\s+(?:care|complaints?)|helpline|toll[\s-]?free)[^a-z0-9]{0,14}(.{4,60})/i, group: 1 },
  ],
  phone: [
    { re: /\b((?:\+91[\s-]?)?(?:1800[\s-]?[0-9]{3}[\s-]?[0-9]{3,4}|[6-9][0-9]{9}))\b/, group: 1 },
  ],
  email: [
    { re: /\b([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})\b/i, group: 1 },
  ],
  country_origin: [
    { re: /(?:country\s+of\s+origin|made\s+in|product\s+of)\s*[:\-]?\s*([a-z ]{3,24})/i, group: 1 },
  ],
  generic_name: [
    // A product title line: mostly capitals, no declaration keywords, no digits.
    { re: /^\s*(?!.*(?:ingredient|mrp|net\s|fssai|batch|mfg|mfd|best\s*before|customer|manufactur|packed|country|rs\.?\s*\d|₹))([A-Z][A-Z &'()-]{4,40})\s*$/m, group: 1 },
    { re: /^\s*(?!.*(?:ingredient|mrp|net\s|fssai|batch|mfg))([A-Z][A-Za-z &'()-]{4,40})\s*$/m, group: 1 },
  ],
  nutrition: [{ re: /\b(nutrition(?:al)?\s+(?:information|facts)|energy\s*\(?kcal)/i }],
  allergen: [{ re: /\b(contains?\s+allergens?|allergen\s+(?:info|declaration)|may\s+contain)\b/i }],
}

const PAN_MASALA = /\b(pan\s*masala|paan\s*masala|gutkha|gutka|supari|betel\s*nut|zarda)\b/i

export function extractFields(ocr: OcrResult, imgW = 0, imgH = 0): { fields: Fields; category: string | null } {
  const text = normalise(ocr.text)
  const fields: Fields = {}
  const baseConf = ocr.confidence || 0.5

  for (const [key, matchers] of Object.entries(MATCHERS)) {
    let found: FieldValue = { value: null, confidence: 0 }
    for (const { re, group } of matchers) {
      const m = text.match(re)
      if (m) {
        const value = (group ? m[group] : m[0])?.trim().replace(/\s+/g, ' ') ?? null
        if (value) {
          // Confidence blends OCR quality with how specific the matcher was.
          const specificity = matchers.indexOf({ re, group } as Matcher) === 0 ? 1 : 0.85
          found = {
            value,
            confidence: Math.min(0.99, baseConf * specificity),
            box: locate(ocr.words, value, imgW, imgH),
          }
          break
        }
      }
    }
    fields[key] = found
  }

  const category = PAN_MASALA.test(text) ? 'pan_masala' : null
  return { fields, category }
}

/** How much of the label did we actually manage to read? */
export function extractionQuality(fields: Fields) {
  const keys = Object.keys(fields)
  const found = keys.filter((k) => fields[k].value)
  const lowConf = found.filter((k) => fields[k].confidence < 0.55)
  return {
    foundCount: found.length,
    totalCount: keys.length,
    lowConfidenceCount: lowConf.length,
    /** Too little text or too much of it uncertain → ask for a retake. */
    unreliable: found.length < 3 || lowConf.length >= 3,
  }
}
