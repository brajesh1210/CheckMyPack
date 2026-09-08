/**
 * Camera access, frame capture and client-side compression.
 * Target: under 500 KB before anything leaves the device.
 */

export const MAX_BYTES = 500 * 1024

export async function openCamera(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1920 },
      height: { ideal: 1440 },
    },
    audio: false,
  })
}

export function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop())
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode the image.'))), 'image/jpeg', quality),
  )
}

/** Draw a source onto a canvas capped at `maxEdge` on its longest side. */
function fit(src: CanvasImageSource, sw: number, sh: number, maxEdge: number) {
  const scale = Math.min(1, maxEdge / Math.max(sw, sh))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(sw * scale)
  canvas.height = Math.round(sh * scale)
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height)
  return canvas
}

/**
 * Compress to <=500 KB, stepping quality down then resolution down.
 * Text legibility matters more than file size, so resolution drops last.
 */
export async function compress(source: Blob | HTMLVideoElement): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  let bmp: ImageBitmap | null = null
  let sw: number
  let sh: number
  let drawable: CanvasImageSource

  if (source instanceof Blob) {
    bmp = await createImageBitmap(source)
    sw = bmp.width
    sh = bmp.height
    drawable = bmp
  } else {
    sw = source.videoWidth
    sh = source.videoHeight
    drawable = source
  }

  let blob: Blob | null = null
  let canvas = fit(drawable, sw, sh, 1600)

  for (const maxEdge of [1600, 1280, 1024, 800]) {
    canvas = fit(drawable, sw, sh, maxEdge)
    for (const q of [0.85, 0.72, 0.6, 0.5, 0.4]) {
      blob = await canvasToBlob(canvas, q)
      if (blob.size <= MAX_BYTES) break
    }
    if (blob && blob.size <= MAX_BYTES) break
  }

  bmp?.close?.()
  const finalBlob = blob!
  const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
  return { blob: finalBlob, dataUrl, width: canvas.width, height: canvas.height }
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result as string)
    fr.onerror = () => reject(fr.error)
    fr.readAsDataURL(blob)
  })
}
