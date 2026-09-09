/**
 * Quality-gate verification harness.
 *
 * The gate decides PASS vs RETAKE before anything is read, so a wrong
 * threshold silently rejects perfectly good packets. These fixtures are the
 * cases that matter, including the one that shipped broken: a white label was
 * scored 62% "glare" and rejected, because the gate counted bright pixels
 * instead of blown ones.
 *
 * Fixtures are synthesised as raw pixel arrays, so this runs in plain Node
 * with no canvas and no browser.
 *
 *   node scripts/verify-quality.mjs
 */
import { build } from 'esbuild'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'

const ROOT = process.cwd().split('\\').join('/')
const src = (p) => `${ROOT}/${p}`

const dir = mkdtempSync(join(tmpdir(), 'cmp-q-'))
const entry = join(dir, 'entry.ts')
writeFileSync(entry, `export { analyseImageData, THRESHOLDS } from '${src('src/lib/quality')}'\n`)
const out = join(dir, 'bundle.mjs')
await build({
  entryPoints: [entry],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  loader: { '.json': 'json' },
  logLevel: 'error',
})
const { analyseImageData, THRESHOLDS } = await import(pathToFileURL(out).href)

let failures = 0
const check = (ok, label, detail = '') => {
  if (ok) {
    console.log(`PASS  ${label}${detail ? ` — ${detail}` : ''}`)
  } else {
    failures++
    console.log(`FAIL  ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

/** Deterministic per-pixel grain, the way sensor noise behaves. */
function noise(x, y, amp) {
  const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return ((h - Math.floor(h)) - 0.5) * 2 * amp
}

/** A grey ImageData. `paint(x, y)` returns the 0-255 value for that pixel. */
function makeImage(w, h, paint) {
  const data = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = Math.max(0, Math.min(255, paint(x, y)))
      const i = (y * w + x) * 4
      data[i] = v
      data[i + 1] = v
      data[i + 2] = v
      data[i + 3] = 255
    }
  }
  return { width: w, height: h, data }
}

const W = 480
const H = 640

/** Legible print: dark bars on a light ground, with sensor grain. */
const print = (paper, ink, grain = 3.5) => (x, y) => {
  const isInk = y > 80 && y < 560 && Math.floor(x / 5) % 3 === 0 && y % 22 < 12
  return (isInk ? ink : paper) + noise(x, y, grain)
}

const fixtures = [
  {
    name: 'legible label (print on a light ground)',
    image: () => makeImage(W, H, print(215, 45)),
    expect: { pass: true },
  },
  {
    // THE REGRESSION. A mostly-white label with legible print. Flour, salt,
    // milk and biscuit packs look exactly like this, and the previous gate
    // scored one at 62% "glare" and rejected it for simply being white.
    name: 'white label with legible print (not glare)',
    image: () => makeImage(W, H, print(248, 45)),
    expect: { pass: true },
    assert: (r) => [`glare ${r.glare} stays under ${THRESHOLDS.glareMax}`, r.glare <= THRESHOLDS.glareMax],
  },
  {
    // As above, exposed a stop brighter — still not clipped, so still fine.
    name: 'brightly exposed white label, still not clipped',
    image: () => makeImage(W, H, print(252, 50)),
    expect: { pass: true },
    assert: (r) => [`glare ${r.glare} stays under ${THRESHOLDS.glareMax}`, r.glare <= THRESHOLDS.glareMax],
  },
  {
    name: 'blown specular highlight over the print',
    image: () => makeImage(W, H, (x, y) => {
      if (Math.hypot(x - W * 0.5, y - H * 0.4) < 150) return 255 // clipped and flat
      return print(215, 45)(x, y)
    }),
    expect: { pass: false, reason: /reflection/i },
  },
  {
    name: 'blurred capture',
    image: () => makeImage(W, H, (x, y) => 128 + 40 * Math.sin(x / 60) + 30 * Math.sin(y / 90) + noise(x, y, 3)),
    expect: { pass: false, reason: /blurred/i },
  },
  {
    name: 'too dark',
    image: () => makeImage(W, H, print(28, 12)),
    expect: { pass: false, reason: /too dark/i },
  },
  {
    name: 'overexposed',
    image: () => makeImage(W, H, (x, y) => {
      const lift = (x / W) * 22 // blown out towards one side
      return print(240 + lift, 208 + lift)(x, y)
    }),
    expect: { pass: false, reason: /overexposed/i },
  },
  {
    name: 'washed out, print does not stand out',
    image: () => makeImage(W, H, print(156, 150)),
    expect: { pass: false, reason: /stand out/i },
  },
]

console.log('Quality gate\n')
for (const f of fixtures) {
  const r = analyseImageData(f.image())
  const detail = `sharpness ${r.sharpness}, glare ${r.glare}, luma ${r.luma}, contrast ${r.contrast}`
  check(r.pass === f.expect.pass, f.name, detail)
  if (f.expect.reason) {
    check(f.expect.reason.test(r.reasons.join(' ')), `  ${f.name}: says why`, r.reasons.join(' / ') || '(no reason given)')
  }
  if (f.assert) {
    const [label, ok] = f.assert(r)
    check(ok, `  ${f.name}: ${label}`)
  }
}

console.log(`\nthresholds: ${JSON.stringify(THRESHOLDS)}`)
console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`)
process.exit(failures === 0 ? 0 : 1)
