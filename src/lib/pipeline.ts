/**
 * End-to-end scan pipeline.
 *
 *   capture → quality gate → compress → read → extract → barcode → rules
 *
 * The "read" stage prefers the online vision model when it is configured and
 * reachable, and falls back to on-device Tesseract otherwise. Either way the
 * reader only produces text; the deterministic engine alone decides the
 * verdict, so a result can always be traced to a statute.
 */

import { assessBlob, type QualityReport } from './quality'
import { compress } from './capture'
import { runOcr } from './ocr'
import { extractFields, extractionQuality, type Fields } from './extract'
import { remoteExtract, remoteConfigured } from './remoteExtract'
import { detectBarcode, lookupOff, crossCheck, type OffProduct } from './barcode'
import { runEngine, type EngineResult } from './engine'

export type Stage = 'compress' | 'quality' | 'read' | 'extract' | 'barcode' | 'rules' | 'done'
export type ReaderUsed = 'gemini' | 'tesseract' | 'none'

export interface PipelineProgress {
  stage: Stage
  detail?: string
  progress?: number
}

export interface ScanOutcome {
  id: string
  createdAt: string
  imageDataUrl: string
  imageWidth: number
  imageHeight: number
  sizeBytes: number
  quality: QualityReport
  reader: ReaderUsed
  ocrText: string
  ocrConfidence: number
  fields: Fields
  category: string | null
  barcode: string | null
  off: OffProduct | null
  crossCheck: ReturnType<typeof crossCheck>
  engine: EngineResult
  productName: string
}

function makeId() {
  const n = Math.floor(Math.random() * 9000 + 1000)
  const s = Math.floor(Math.random() * 9000 + 1000)
  return `CMP-${n}-${s}`
}

function guessProductName(fields: Fields, off: OffProduct | null): string {
  if (off?.name) return off.brand ? `${off.brand} ${off.name}`.slice(0, 60) : off.name
  if (fields.generic_name?.value) return fields.generic_name.value
  if (fields.manufacturer?.value) return fields.manufacturer.value.split(/[,.]/)[0]
  return 'Unidentified product'
}

/** Prefer a value the remote reader found; otherwise keep the local one. */
function mergeFields(local: Fields, remote: Fields): Fields {
  const out: Fields = { ...local }
  for (const [key, rv] of Object.entries(remote)) {
    const lv = local[key]
    if (rv.value && (!lv?.value || rv.confidence >= (lv.confidence ?? 0))) {
      out[key] = { ...rv, box: rv.box ?? lv?.box }
    }
  }
  return out
}

export async function runPipeline(
  source: Blob | HTMLVideoElement,
  onProgress: (p: PipelineProgress) => void,
  opts: { online?: boolean; forceLocal?: boolean } = {},
): Promise<ScanOutcome> {
  const online = opts.online ?? navigator.onLine

  // 1 ─ compress first so every later stage shares one small image
  onProgress({ stage: 'compress', detail: 'Compressing to under 500 KB' })
  const { blob, dataUrl, width, height } = await compress(source)

  // 2 ─ quality gate
  onProgress({ stage: 'quality', detail: 'Checking sharpness, glare and light' })
  const quality = await assessBlob(blob)

  const id = makeId()
  const createdAt = new Date().toISOString()

  // A failed gate short-circuits: nothing is read, nothing is accused.
  if (!quality.pass) {
    return {
      id,
      createdAt,
      imageDataUrl: dataUrl,
      imageWidth: width,
      imageHeight: height,
      sizeBytes: blob.size,
      quality,
      reader: 'none',
      ocrText: '',
      ocrConfidence: 0,
      fields: {},
      category: null,
      barcode: null,
      off: null,
      crossCheck: null,
      engine: runEngine({}, null, { unreliable: true }),
      productName: 'Unreadable photo',
    }
  }

  // 3 ─ read the label
  let reader: ReaderUsed = 'tesseract'
  let fields: Fields = {}
  let category: string | null = null
  let rawText = ''
  let confidence = 0

  const useRemote = online && remoteConfigured() && !opts.forceLocal

  if (useRemote) {
    onProgress({ stage: 'read', detail: 'Reading the label' })
    const remote = await remoteExtract(blob)
    if (remote) {
      reader = 'gemini'
      fields = remote.fields
      category = remote.category
      rawText = remote.rawText
      confidence = remote.legibility
    }
  }

  if (reader !== 'gemini') {
    // Offline, unconfigured, or the remote call failed — read on-device.
    onProgress({ stage: 'read', detail: 'Reading the label on this device', progress: 0 })
    const ocr = await runOcr(blob, (p) =>
      onProgress({ stage: 'read', detail: 'Reading the label on this device', progress: p }),
    )
    reader = 'tesseract'
    rawText = ocr.text
    confidence = ocr.confidence

    onProgress({ stage: 'extract', detail: 'Identifying declarations' })
    const local = extractFields(ocr, width, height)
    fields = local.fields
    category = local.category
  } else {
    // Run the local matchers too: they contribute bounding boxes, which the
    // remote reader cannot provide, and they corroborate what it found.
    onProgress({ stage: 'extract', detail: 'Identifying declarations' })
    try {
      const ocr = await runOcr(blob)
      const local = extractFields(ocr, width, height)
      fields = mergeFields(local.fields, fields)
      category = category ?? local.category
      if (!rawText) rawText = ocr.text
    } catch {
      // Boxes are a nicety; losing them must not fail the scan.
    }
  }

  const exq = extractionQuality(fields)

  // 4 ─ corroborate against the barcode database
  onProgress({ stage: 'barcode', detail: 'Cross-checking the barcode' })
  const barcode = await detectBarcode(blob)
  let off: OffProduct | null = null
  if (barcode && online) off = await lookupOff(barcode)
  const cross = crossCheck(off, fields.net_qty?.value ?? null)

  // 5 ─ adjudicate
  onProgress({ stage: 'rules', detail: 'Applying LMPC and FSSAI rules' })
  const engine = runEngine(fields, category, { unreliable: exq.unreliable, fullText: rawText })

  onProgress({ stage: 'done' })

  return {
    id,
    createdAt,
    imageDataUrl: dataUrl,
    imageWidth: width,
    imageHeight: height,
    sizeBytes: blob.size,
    quality,
    reader,
    ocrText: rawText,
    ocrConfidence: confidence,
    fields,
    category,
    barcode,
    off,
    crossCheck: cross,
    engine,
    productName: guessProductName(fields, off),
  }
}
