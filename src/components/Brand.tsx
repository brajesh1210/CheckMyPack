/**
 * Brand marks — drawn as crisp vector geometry matching the CheckMyPack design system.
 * Green rounded badge enclosing a package box with top sprout leaf & scan check.
 */

export function Mark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      role="img"
      aria-label="CheckMyPack"
      className={className}
    >
      <rect width="36" height="36" rx="10" fill="currentColor" />
      {/* Reticle / scanner corners */}
      <g stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.45">
        <path d="M7 11V8.5A1.5 1.5 0 0 1 8.5 7H11" />
        <path d="M25 7h2.5A1.5 1.5 0 0 1 29 8.5V11" />
        <path d="M29 25v2.5a1.5 1.5 0 0 1-1.5 1.5H25" />
        <path d="M11 29H8.5A1.5 1.5 0 0 1 7 27.5V25" />
      </g>
      {/* Central box package */}
      <path
        d="M12 14.5L18 11.5L24 14.5V21.5L18 24.5L12 21.5V14.5Z"
        fill="#fff"
        fillOpacity="0.22"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Sprout leaf at top */}
      <path
        d="M18 11.5C18 8 21.5 7 22.5 7C22.5 9.5 20.5 11.5 18 11.5Z"
        fill="#fff"
        fillOpacity="0.8"
        stroke="#fff"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      {/* Verification checkmark inside */}
      <path
        d="M15 18L17.2 20.2L21.5 15.5"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
          style={{ fontSize: size * 0.54 }}
        >
          CheckMyPack
        </div>
        {sub && (
          <div
            className={`mt-1 text-2xs font-medium tracking-[0.06em] ${
              tone === 'light' ? 'text-white/75' : 'text-ink-500'
            }`}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  )
}
