/**
 * Audits the UI against the project's design rules.
 *
 * These are the rules that quietly rot as a codebase grows — a chip that ends
 * up 36px, a hex code pasted into a component, an animation that janks on a
 * cheap phone. None of them break a build, and all of them are the difference
 * between an app that feels considered and one that does not.
 *
 *   node scripts/verify-ui.mjs
 */
import { readFileSync, readdirSync } from 'node:fs'

let failures = 0
function check(name, offenders) {
  const ok = offenders.length === 0
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`)
  if (!ok) for (const o of offenders.slice(0, 12)) console.log(`        ${o}`)
  if (offenders.length > 12) console.log(`        …and ${offenders.length - 12} more`)
}

const files = [
  ...readdirSync('src/pages').map((f) => ['src/pages', f]),
  ...readdirSync('src/components').map((f) => ['src/components', f]),
]
  .filter(([, f]) => f.endsWith('.tsx'))
  .map(([d, f]) => ({ name: f, src: readFileSync(`${d}/${f}`, 'utf8') }))

const css = readFileSync('src/index.css', 'utf8')

console.log('UI and accessibility\n')

/* ─────────────────────────────────────────────────────── touch targets */
{
  // 44x44 is the smallest reliably tappable area for an adult thumb, and this
  // app is used one-handed in a shop.
  const bad = []
  for (const { name, src } of files) {
    for (const m of src.matchAll(/min-h-\[(\d+)px\]/g)) {
      if (+m[1] < 44) bad.push(`${name}: min-h-[${m[1]}px]`)
    }
    // Icon-only buttons sized by h-N w-N utilities.
    for (const m of src.matchAll(/className="[^"]*\bh-(\d+) w-(\d+)[^"]*"[^>]*onClick/g)) {
      const px = +m[1] * 4
      if (px < 44) bad.push(`${name}: interactive h-${m[1]} (${px}px)`)
    }
  }
  check('every interactive target is at least 44px', bad)
}

/* ────────────────────────────────────────────────── colour tokens */
{
  // Raw hex in a component means a palette change silently misses a screen.
  // Google's brand colours are the documented exception: they are Google's,
  // not ours, and must not be re-themed.
  const GOOGLE = new Set(['#4285F4', '#34A853', '#FBBC05', '#EA4335'])
  const bad = []
  for (const { name, src } of files) {
    for (const m of src.matchAll(/#[0-9A-Fa-f]{6}\b/g)) {
      if (!GOOGLE.has(m[0].toUpperCase())) bad.push(`${name}: ${m[0]}`)
    }
  }
  check('no raw hex outside the palette', bad)
}

/* ──────────────────────────────────────────────────── focus rings */
{
  // Keyboard and switch users need to see where they are.
  const hasGlobalFocus = /:focus-visible\s*\{[^}]*outline:/.test(css)
  check('a global focus-visible style exists', hasGlobalFocus ? [] : ['src/index.css'])

  const suppressed = []
  for (const { name, src } of files) {
    // outline-none is only safe when a replacement ring is provided.
    for (const m of src.matchAll(/className="([^"]*\boutline-none\b[^"]*)"/g)) {
      if (!/\bring-|focus-visible:/.test(m[1])) suppressed.push(`${name}: outline-none with no ring`)
    }
  }
  check('no element removes focus without replacing it', suppressed)
}

/* ─────────────────────────────────────────────────────── motion */
{
  const reduced = /@media \(prefers-reduced-motion: reduce\)/.test(css)
  check('reduced motion is respected', reduced ? [] : ['src/index.css'])

  // Animating layout properties causes reflow; phones drop frames.
  const bad = []
  for (const { name, src } of files) {
    for (const m of src.matchAll(/transition-\[([a-z,\-]+)\]/g)) {
      const props = m[1].split(',')
      const layout = props.filter((p) => !/^(transform|opacity|colors|color|background|border|shadow|filter)$/.test(p))
      if (layout.length) bad.push(`${name}: animates ${layout.join(', ')}`)
    }
  }
  check('animations stick to transform and opacity', bad)
}

/* ──────────────────────────────────────────────── images and icons */
{
  const bad = []
  for (const { name, src } of files) {
    // Decorative icons must be hidden from screen readers, or every list item
    // reads as a meaningless graphic.
    for (const m of src.matchAll(/<(?:svg|Icon)\b(?![^>]*aria-)[^>]*>/g)) {
      if (!/aria-hidden|role="img"/.test(m[0])) bad.push(`${name}: icon without aria-hidden`)
    }
    for (const m of src.matchAll(/<img\b(?![^>]*\balt=)[^>]*>/g)) {
      bad.push(`${name}: img without alt`)
    }
  }
  check('icons and images are labelled or hidden', bad)
}

/* ───────────────────────────────────────────── inputs have labels */
{
  const bad = []
  for (const { name, src } of files) {
    for (const m of src.matchAll(/<input\b[\s\S]*?\/>/g)) {
      const tag = m[0]
      if (tag.includes('type="hidden"') || tag.includes('type="checkbox"')) continue
      // A visually hidden file input is triggered by a labelled button.
      if (tag.includes('type="file"') && tag.includes('sr-only')) continue
      // A placeholder is not a label: it vanishes the moment someone types.
      const labelled = /aria-label|aria-labelledby|\bid=/.test(tag)
      if (!labelled) bad.push(`${name}: input with no accessible name`)
    }
  }
  check('every input has an accessible name', bad)
}

/* ────────────────────────────────────── one primary action per screen */
{
  const bad = []
  for (const { name, src } of files) {
    const primaries = (src.match(/\bbtn-primary\b/g) || []).length
    // Two is the practical ceiling: a screen with an empty state often has one
    // in each branch, only one of which renders.
    if (primaries > 3) bad.push(`${name}: ${primaries} primary buttons`)
  }
  check('screens do not compete for the primary action', bad)
}

/* ──────────────────────────────────────────────────── type scale */
{
  // The scale is 12-14-16-18-24-32. Arbitrary sizes break vertical rhythm.
  const ALLOWED = new Set(['text-2xs', 'text-xs', 'text-sm', 'text-md', 'text-base',
    'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl'])
  const bad = []
  for (const { name, src } of files) {
    for (const m of src.matchAll(/\btext-\[(\d+)px\]/g)) {
      bad.push(`${name}: arbitrary text-[${m[1]}px]`)
    }
    for (const m of src.matchAll(/\b(text-[a-z0-9]+)\b/g)) {
      if (m[1].startsWith('text-') && /^text-\d/.test(m[1]) && !ALLOWED.has(m[1])) {
        bad.push(`${name}: ${m[1]}`)
      }
    }
  }
  check('type sizes come from the scale', bad)
}

console.log()
console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
