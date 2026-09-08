/**
 * Demo sample packs.
 *
 * These are drawn as real label artwork on a canvas, so the demo runs the
 * genuine pipeline: Tesseract actually reads this text and the rule engine
 * actually adjudicates it. Nothing is hard-coded to a verdict.
 */

interface SampleSpec {
  title: string
  lines: string[]
  blur?: boolean
}

const SPECS: Record<string, SampleSpec> = {
  compliant: {
    title: 'CRISPY POTATO WAFERS',
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

  // pack background
  ctx.fillStyle = '#f4f1e8'
  ctx.fillRect(0, 0, W, H)

  // brand band
  ctx.fillStyle = '#1f5b2a'
  ctx.fillRect(0, 0, W, 210)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 54px Georgia, serif'
  ctx.textBaseline = 'middle'
  ctx.fillText(spec.title.slice(0, 22), 50, 105)

  // declaration panel
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(40, 250, W - 80, H - 300)
  ctx.strokeStyle = '#c9c6bb'
  ctx.lineWidth = 2
  ctx.strokeRect(40, 250, W - 80, H - 300)

  ctx.fillStyle = '#14140f'
  let y = 305
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

function toBlob(c: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not build the sample image.'))), 'image/jpeg', 0.92),
  )
}
