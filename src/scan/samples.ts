/**
 * Demo sample packs.
 *
 * These are drawn as real label artwork on a canvas, so the demo runs the
 * genuine pipeline: Tesseract actually reads this text and the rule engine
 * actually adjudicates it. Nothing is hard-coded to a verdict.
 */

interface SampleSpec {
  title: string
  /** Printed on the declaration panel as well as the brand band, as most
   *  real packs do. The brand band is white-on-dark, which OCR often drops,
   *  and statutory generic-name checks read better from the panel. */
  name: string
  lines: string[]
  blur?: boolean
}

const SPECS: Record<string, SampleSpec> = {
  compliant: {
    title: 'CRISPY POTATO WAFERS',
    name: 'Crispy Potato Wafers',
    lines: [
      'Ingredients: Potato, Edible Vegetable Oil,',
      'Iodised Salt, Spices and Condiments',
      '',
      'Net Weight: 200 g',
      'MRP Rs. 45.00 (inclusive of all taxes)',
      'Mfg: 03/2026        Best Before: 12/2027',
      'Batch No: KP2263',
      '',
      'FSSAI Lic. No. 10012041000123',
      'Veg',
      '',
      'Manufactured & Packed by:',
      'Namkeen Foods Pvt Ltd, Plot 14,',
      'MIDC Industrial Area, Pune 411019',
      'Country of Origin: India',
      '',
      'Customer Care: 1800 222 333',
      'care@namkeenfoods.example',
    ],
  },
  violation: {
    title: 'MASALA MUNCH MIXTURE',
    name: 'Masala Munch Mixture',
    lines: [
      'Ingredients: Gram Flour, Edible Vegetable Oil,',
      'Peanuts, Iodised Salt, Spices',
      '',
      'Net Weight: 150 g',
      'Mfg: 01/2026        Best Before: 09/2026',
      'Batch No: MM8891',
      '',
      'FSSAI Lic. No. 20815022000456',
      'Veg',
      '',
      'Manufactured & Packed by:',
      'Snack Corner Industries, Shed 8,',
      'GIDC Estate, Rajkot 360003',
      'Country of Origin: India',
    ],
    // No MRP line, no customer care → critical violations.
  },
  blurry: {
    title: 'ROASTED CASHEW NUTS',
    name: 'Roasted Cashew Nuts',
    lines: [
      'Net Weight: 100 g',
      'MRP Rs. 180.00 inclusive of all taxes',
      'Mfg: 02/2026     Best Before: 08/2027',
      'FSSAI Lic. No. 10014031000789',
      'Customer Care: 1800 111 444',
    ],
    blur: true,
  },
}

export async function makeSampleBlob(id: string): Promise<Blob> {
  const spec = SPECS[id] ?? SPECS.compliant
  const W = 900
  const H = 1200

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Pack background. Tones here are photographic rather than pure white: no
  // camera returns a perfectly uniform 255-valued region, there is always
  // shading and sensor grain, and the quality gate is calibrated for that.
  ctx.fillStyle = '#efece1'
  ctx.fillRect(0, 0, W, H)

  // Soft side shading, as a pack photographed under a room light would have.
  const shade = ctx.createLinearGradient(0, 0, W, H)
  shade.addColorStop(0, 'rgba(255,255,255,0.20)')
  shade.addColorStop(0.55, 'rgba(255,255,255,0)')
  shade.addColorStop(1, 'rgba(0,0,0,0.10)')
  ctx.fillStyle = shade
  ctx.fillRect(0, 0, W, H)

  // brand band
  ctx.fillStyle = '#1f5b2a'
  ctx.fillRect(0, 0, W, 210)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 54px Georgia, serif'
  ctx.textBaseline = 'middle'
  ctx.fillText(spec.title.slice(0, 22), 50, 105)

  // declaration panel — paper, not screen white
  ctx.fillStyle = '#f6f3ea'
  ctx.fillRect(40, 250, W - 80, H - 300)
  ctx.strokeStyle = '#c9c6bb'
  ctx.lineWidth = 2
  ctx.strokeRect(40, 250, W - 80, H - 300)

  // product name, repeated at the head of the declaration panel
  ctx.fillStyle = '#14140f'
  ctx.font = 'bold 34px Georgia, serif'
  ctx.fillText(spec.name, 70, 300)

  ctx.fillStyle = '#14140f'
  let y = 348
  for (const line of spec.lines) {
    if (!line) {
      y += 22
      continue
    }
    const bold = /^(Net Weight|MRP|FSSAI|Customer Care|Mfg)/.test(line)
    ctx.font = `${bold ? 'bold ' : ''}30px Arial, Helvetica, sans-serif`
    ctx.fillText(line, 70, y)
    y += 44
  }

  // veg mark
  ctx.strokeStyle = '#1f7a2e'
  ctx.lineWidth = 4
  ctx.strokeRect(W - 150, H - 150, 56, 56)
  ctx.fillStyle = '#1f7a2e'
  ctx.beginPath()
  ctx.arc(W - 122, H - 122, 16, 0, Math.PI * 2)
  ctx.fill()

  // Sensor grain. Keeps the image out of the "blown highlight" branch of the
  // quality gate, and is what a real photograph actually looks like.
  addGrain(ctx, W, H, 4)

  if (spec.blur) {
    // Re-draw through a blur filter to genuinely fail the sharpness gate.
    const out = document.createElement('canvas')
    out.width = W
    out.height = H
    const octx = out.getContext('2d')!
    octx.filter = 'blur(6px) brightness(1.08)'
    octx.drawImage(canvas, 0, 0)
    // add a specular highlight
    const grad = octx.createRadialGradient(W * 0.62, H * 0.34, 20, W * 0.62, H * 0.34, 300)
    grad.addColorStop(0, 'rgba(255,255,255,0.95)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    octx.filter = 'none'
    octx.fillStyle = grad
    octx.fillRect(0, 0, W, H)
    return toBlob(out)
  }

  return toBlob(canvas)
}

function addGrain(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) {
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 2 * amount
    d[i] = clamp8(d[i] + n)
    d[i + 1] = clamp8(d[i + 1] + n)
    d[i + 2] = clamp8(d[i + 2] + n)
  }
  ctx.putImageData(img, 0, 0)
}

function clamp8(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v
}

function toBlob(c: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not build the sample image.'))), 'image/jpeg', 0.92),
  )
}
