/**
 * On-device image quality gate.
 *
 * Runs before any extraction so an unreadable photo is never judged.
 * Everything here is plain canvas maths — no model, no network.
 */

export interface QualityReport {
  sharpness: number // variance of Laplacian; higher is sharper
  glare: number // fraction of near-blown-out pixels, 0..1
  luma: number // mean brightness, 0..255
  contrast: number // std-dev of luma
  pass: boolean
  reasons: string[]
}

export const THRESHOLDS = {
  sharpnessMin: 120,
  glareMax: 0.22,
  lumaMin: 45,
  lumaMax: 235,
  contrastMin: 22,
}

/** Downscale to a working size so the gate is fast on low-end phones. */
function toWorkingCanvas(src: CanvasImageSource, w: number, h: number, max = 640) {
  const scale = Math.min(1, max / Math.max(w, h))
  const cw = Math.max(1, Math.round(w * scale))
  const ch = Math.max(1, Math.round(h * scale))
  const c = document.createElement('canvas')
  c.width = cw
  c.height = ch
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(src, 0, 0, cw, ch)
  return { canvas: c, ctx, w: cw, h: ch }
}

export function analyseImageData(data: ImageData): QualityReport {
  const { width: w, height: h, data: px } = data
  const n = w * h
  const grey = new Float32Array(n)

  let sum = 0
  let blown = 0
  for (let i = 0; i < n; i++) {
    const r = px[i * 4]
    const g = px[i * 4 + 1]
    const b = px[i * 4 + 2]
    // Rec. 601 luma
    const y = 0.299 * r + 0.587 * g + 0.114 * b
    grey[i] = y
    sum += y
    // "glare" = near-white AND desaturated (a specular highlight, not white print)
    if (y > 244 && Math.max(r, g, b) - Math.min(r, g, b) < 16) blown++
  }
  const mean = sum / n

  let varSum = 0
  for (let i = 0; i < n; i++) varSum += (grey[i] - mean) ** 2
  const contrast = Math.sqrt(varSum / n)

  // Variance of the 4-neighbour Laplacian → focus measure
  let lSum = 0
  let lSqSum = 0
  let count = 0
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      const lap = 4 * grey[i] - grey[i - 1] - grey[i + 1] - grey[i - w] - grey[i + w]
      lSum += lap
      lSqSum += lap * lap
      count++
    }
  }
  const lMean = lSum / Math.max(1, count)
  const sharpness = lSqSum / Math.max(1, count) - lMean * lMean

  const glare = blown / n

  const reasons: string[] = []
  if (sharpness < THRESHOLDS.sharpnessMin) reasons.push('The photo is too blurred to read reliably.')
  if (glare > THRESHOLDS.glareMax) reasons.push('A bright reflection is covering part of the label.')
  if (mean < THRESHOLDS.lumaMin) reasons.push('The photo is too dark.')
  if (mean > THRESHOLDS.lumaMax) reasons.push('The photo is overexposed.')
  if (contrast < THRESHOLDS.contrastMin) reasons.push('The text does not stand out from the background.')

  return {
    sharpness: Math.round(sharpness),
    glare: Math.round(glare * 1000) / 1000,
    luma: Math.round(mean),
    contrast: Math.round(contrast),
    pass: reasons.length === 0,
    reasons,
  }
}

export async function assessBlob(blob: Blob): Promise<QualityReport> {
  const bmp = await createImageBitmap(blob)
  const { ctx, w, h } = toWorkingCanvas(bmp, bmp.width, bmp.height)
  const report = analyseImageData(ctx.getImageData(0, 0, w, h))
  bmp.close?.()
  return report
}

export function assessVideoFrame(video: HTMLVideoElement): QualityReport | null {
  if (!video.videoWidth) return null
  const { ctx, w, h } = toWorkingCanvas(video, video.videoWidth, video.videoHeight, 320)
  return analyseImageData(ctx.getImageData(0, 0, w, h))
}

/** Percentage readouts for the UI (0-100, clamped). */
export function asPercentages(q: QualityReport) {
  const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)))
  return {
    sharpness: clamp((q.sharpness / (THRESHOLDS.sharpnessMin * 2)) * 100),
    glare: clamp(q.glare * 100),
    brightness: clamp((q.luma / 255) * 100),
  }
}
