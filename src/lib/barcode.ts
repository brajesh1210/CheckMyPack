/**
 * Barcode detection (native BarcodeDetector when available) and an
 * Open Food Facts lookup used to corroborate what the OCR read.
 */

export interface OffProduct {
  code: string
  name: string | null
  brand: string | null
  quantity: string | null
  ingredients: string | null
  countries: string | null
  imageUrl: string | null
}

export async function detectBarcode(source: Blob | HTMLVideoElement): Promise<string | null> {
  const Detector = (window as unknown as { BarcodeDetector?: new (o?: unknown) => { detect: (s: unknown) => Promise<{ rawValue: string }[]> } }).BarcodeDetector
  if (!Detector) return null
  try {
    const detector = new Detector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] })
    const input = source instanceof Blob ? await createImageBitmap(source) : source
    const codes = await detector.detect(input)
    return codes[0]?.rawValue ?? null
  } catch {
    return null
  }
}

export async function lookupOff(code: string, signal?: AbortSignal): Promise<OffProduct | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=code,product_name,brands,quantity,ingredients_text,countries,image_front_url`,
      { signal },
    )
    if (!res.ok) return null
    const json = (await res.json()) as {
      status: number
      product?: Record<string, string | undefined>
    }
    if (json.status !== 1 || !json.product) return null
    const p = json.product
    return {
      code,
      name: p.product_name || null,
      brand: p.brands || null,
      quantity: p.quantity || null,
      ingredients: p.ingredients_text || null,
      countries: p.countries || null,
      imageUrl: p.image_front_url || null,
    }
  } catch {
    return null
  }
}

/** Does the database agree with what we read off the pack? */
export function crossCheck(off: OffProduct | null, netQty: string | null) {
  if (!off) return null
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '').replace(/gm(s)?$/, 'g')
  const agrees =
    !!off.quantity && !!netQty && norm(off.quantity) === norm(netQty)
  return {
    product: off,
    quantityMatches: agrees,
    note: !off.quantity || !netQty
      ? 'Net quantity could not be compared with the database record.'
      : agrees
        ? 'Net quantity matches the Open Food Facts record.'
        : `Label says ${netQty}, database record says ${off.quantity}.`,
  }
}
