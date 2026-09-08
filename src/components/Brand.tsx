/**
 * Brand marks — drawn as crisp vector geometry, not raster art.
 * Mark = scan reticle enclosing a package silhouette with a leaf notch.
 */

export function Mark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="CheckMyPack"
      className={className}
    >
      <rect width="32" height="32" rx="9" fill="currentColor" />
      {/* scan reticle corners */}
      <g stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.55">
        <path d="M7 11V8.6A1.6 1.6 0 0 1 8.6 7H11" />
        <path d="M21 7h2.4A1.6 1.6 0 0 1 25 8.6V11" />
        <path d="M25 21v2.4a1.6 1.6 0 0 1-1.6 1.6H21" />
        <path d="M11 25H8.6A1.6 1.6 0 0 1 7 23.4V21" />
      </g>
      {/* package + check */}
      <path
        d="M11 13.6 16 11l5 2.6v5.1L16 21.4l-5-2.7v-5.1Z"
        fill="#fff"
        fillOpacity="0.16"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="m13.4 16.3 1.9 1.9 3.5-3.7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Wordmark({
  size = 32,
  tone = 'dark',
  sub,
}: {
  size?: number
  tone?: 'dark' | 'light'
  sub?: string
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Mark size={size} className={tone === 'light' ? 'text-white/95' : 'text-brand-500'} />
      <div className="leading-none">
        <div
          className={`font-display font-semibold tracking-[-0.02em] ${
            tone === 'light' ? 'text-white' : 'text-ink-900'
          }`}
          style={{ fontSize: size * 0.53 }}
        >
          CheckMyPack
        </div>
        {sub && (
          <div
            className={`mt-1 text-2xs font-medium tracking-[0.06em] ${
              tone === 'light' ? 'text-white/70' : 'text-ink-500'
            }`}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  )
}
