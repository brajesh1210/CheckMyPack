/**
 * On-device text extraction with Tesseract.js (WASM).
 * Loaded lazily so it never blocks first paint.
 */

import type { Worker } from 'tesseract.js'

export interface OcrWord {
  text: string
  confidence: number
  bbox: { x0: number; y0: number; x1: number; y1: number }
}

export interface OcrResult {
  text: string
  lines: string[]
  words: OcrWord[]
  confidence: number
  width: number
  height: number
}

let workerPromise: Promise<Worker> | null = null

async function getWorker(onProgress?: (p: number) => void): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js')
      return createWorker('eng', 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') onProgress?.(m.progress)
        },
      })
    })()
  }
  return workerPromise
}

export async function runOcr(image: Blob | string, onProgress?: (p: number) => void): Promise<OcrResult> {
  const worker = await getWorker(onProgress)
  const { data } = await worker.recognize(image as never, {}, { blocks: true })

  const words: OcrWord[] = []
  // tesseract.js v5 exposes blocks → paragraphs → lines → words
  const blocks = (data as unknown as { blocks?: unknown[] }).blocks ?? []
  for (const b of blocks as never[]) {
    for (const p of ((b as { paragraphs?: never[] }).paragraphs ?? []) as never[]) {
      for (const l of ((p as { lines?: never[] }).lines ?? []) as never[]) {
        for (const w of ((l as { words?: never[] }).words ?? []) as never[]) {
          const ww = w as { text: string; confidence: number; bbox: OcrWord['bbox'] }
          if (ww.text?.trim()) {
            words.push({ text: ww.text, confidence: ww.confidence ?? 0, bbox: ww.bbox })
          }
        }
      }
    }
  }

  const text = data.text ?? ''
  return {
    text,
    lines: text.split('\n').map((l) => l.trim()).filter(Boolean),
    words,
    confidence: (data.confidence ?? 0) / 100,
    width: 0,
    height: 0,
  }
}

export async function disposeOcr() {
  if (workerPromise) {
    const w = await workerPromise
    await w.terminate()
    workerPromise = null
  }
}
