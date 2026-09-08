/**
 * End-to-end scan pipeline.
 *
 *   capture → quality gate → compress → OCR → extract → barcode → rules
 *
 * The gate can abort early with RETAKE; the rule engine is the only thing
 * that ever produces a PASS or VIOLATION.
 */

import { assessBlob, type QualityReport } from './quality'
import { compress } from './capture'
import { runOcr } from './ocr'
import { extractFields, extractionQuality, type Fields } from './extract'
import { detectBarcode, lookupOff, crossCheck, type OffProduct } from './barcode'
import { runEngine, type EngineResult } from './engine'

export type Stage =
  | 'quality'
  | 'compress'
  | 'ocr'
  | 'extract'
  | 'barcode'
  | 'rules'
  | 'done'

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

export async function runPipeline(
  source: Blob | HTMLVideoElement,
  onProgress: (p: PipelineProgress) => void,
  opts: { online?: boolean } = {},
): Promise<ScanOutcome> {
  // 1 ─ compress first so every later stage works on the same small image
  onProgress({ stage: 'compress', detail: 'Compressing to under 500 KB' })
  const { blob, dataUrl, width, height } = await compress(source)

  // 2 ─ quality gate
  onProgress({ stage: 'quality', detail: 'Checking sharpness, glare and light' })
  const quality = await assessBlob(blob)

  const id = makeId()
  const createdAt = new Date().toISOString()

  // Gate failure short-circuits: no extraction, no accusation.
  if (!quality.pass) {
    const engine = runEngine({}, null, { unreliable: true })
    return {
      id,
      createdAt,
      imageDataUrl: dataUrl,
      imageWidth: width,
      imageHeight: height,
      sizeBytes: blob.size,
      quality,
      ocrText: '',
      ocrConfidence: 0,
      fields: {},
      category: null,
      barcode: null,
      off: null,
      crossCheck: null,
      engine,
      productName: 'Unreadable photo',
    }
  }

  // 3 ─ text extraction
  onProgress({ stage: 'ocr', detail: 'Reading the label', progress: 0 })
  const ocr = await runOcr(blob, (p) =>
    onProgress({ stage: 'ocr', detail: 'Reading the label', progress: p }),
  )

  // 4 ─ structure the declarations
  onProgress({ stage: 'extract', detail: 'Identifying declarations' })
  const { fields, category } = extractFields(ocr, width, height)
  const exq = extractionQuality(fields)

  // 5 ─ corroborate with the barcode database
  onProgress({ stage: 'barcode', detail: 'Cross-checking the barcode' })
  const barcode = await detectBarcode(blob)
  let off: OffProduct | null = null
  if (barcode && (opts.online ?? navigator.onLine)) {
    off = await lookupOff(barcode)
  }
  const cross = crossCheck(off, fields.net_qty?.value ?? null)

  // 6 ─ adjudicate
  onProgress({ stage: 'rules', detail: 'Applying LMPC and FSSAI rules' })
  const engine = runEngine(fields, category, { unreliable: exq.unreliable, fullText: ocr.text })

  onProgress({ stage: 'done' })

  return {
    id,
    createdAt,
    imageDataUrl: dataUrl,
    imageWidth: width,
    imageHeight: height,
    sizeBytes: blob.size,
    quality,
    ocrText: ocr.text,
    ocrConfidence: ocr.confidence,
    fields,
    category,
    barcode,
    off,
    crossCheck: cross,
    engine,
    productName: guessProductName(fields, off),
  }
}
