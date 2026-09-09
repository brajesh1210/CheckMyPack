/**
 * Visual renderer for product packaging mockups.
 * Renders high-fidelity, crisp vector package artwork with statutory declaration panels,
 * barcode marks, FSSAI logos, and customizable bounding boxes.
 */

export function PackVisual({
  product = 'amul',
  highlight = 'none',
  glare = false,
  className = '',
}: {
  product?: string
  highlight?: 'none' | 'pass' | 'violation' | 'mrp' | 'fssai'
  glare?: boolean
  className?: string
}) {
  const isAmul = product.toLowerCase().includes('amul')
  const isSunfeast = product.toLowerCase().includes('sunfeast') || product.toLowerCase().includes('britannia')
  const isBikano = product.toLowerCase().includes('bikano') || product.toLowerCase().includes('bhujia')
  const isOil = product.toLowerCase().includes('fortune') || product.toLowerCase().includes('oil')

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-ink-100 shadow-inner ${className}`} role="img" aria-label={`Package label for ${product}`}>
      <svg viewBox="0 0 400 320" className="h-full w-full object-cover select-none" aria-hidden>
        <defs>
          <linearGradient id="pouch-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isAmul ? 'var(--cmp-amul-bg)' : isSunfeast ? 'var(--cmp-sunfeast-bg)' : isBikano ? 'var(--cmp-bikano-bg)' : isOil ? 'var(--cmp-oil-bg)' : 'var(--cmp-info-soft)'} />
            <stop offset="50%" stopColor="#fff" />
            <stop offset="100%" stopColor={isAmul ? 'var(--cmp-amul-bg)' : isSunfeast ? 'var(--cmp-sunfeast-bg)' : isBikano ? 'var(--cmp-bikano-bg)' : isOil ? 'var(--cmp-oil-bg)' : 'var(--cmp-info-soft)'} />
          </linearGradient>

          <linearGradient id="brand-header-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isAmul ? 'var(--cmp-amul-head)' : isSunfeast ? 'var(--cmp-sunfeast-head)' : isBikano ? 'var(--cmp-bikano-head)' : isOil ? 'var(--cmp-oil-head)' : 'var(--cmp-ink)'} />
            <stop offset="100%" stopColor={isAmul ? 'var(--cmp-info)' : isSunfeast ? 'var(--cmp-bad)' : isBikano ? 'var(--cmp-warn)' : isOil ? 'var(--cmp-ok)' : 'var(--cmp-ink)'} />
          </linearGradient>

          <radialGradient id="glare-grad" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.92" />
            <stop offset="40%" stopColor="#fff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Pouch body */}
        <rect x="20" y="15" width="360" height="290" rx="16" fill="url(#pouch-grad)" stroke="var(--cmp-ok-line)" strokeWidth="1.5" />
        
        {/* Top brand header banner */}
        <path d="M20 27 Q20 15 32 15 L368 15 Q380 15 380 27 L380 75 L20 75 Z" fill="url(#brand-header-grad)" />
        <text x="40" y="48" fill="#fff" fontFamily="Lexend, sans-serif" fontWeight="bold" fontSize="18">
          {isAmul ? 'Amul Taaza Milk' : isSunfeast ? 'Britannia Sunfeast' : isBikano ? 'Bikano Aloo Bhujia' : isOil ? 'Fortune Sunlite Oil' : 'Crispy Potato Wafers'}
        </text>
        <text x="40" y="66" fill="#fff" fillOpacity="0.85" fontFamily="Inter, sans-serif" fontSize="10">
          {isAmul ? 'Toned Milk · Homogenised' : isSunfeast ? 'Glucose Biscuits · Fortified' : isBikano ? 'Crispy Spiced Potato Sev' : isOil ? 'Refined Sunflower Oil' : 'Mandatory Declarations Panel'}
        </text>

        {/* Declaration Box / Panel */}
        <rect x="35" y="88" width="330" height="205" rx="10" fill="#fff" fillOpacity="0.95" stroke="var(--cmp-ok-line)" strokeWidth="1" />

        {/* Net Qty & MRP lines */}
        <text x="50" y="112" fill="var(--cmp-ink)" fontFamily="Inter, sans-serif" fontWeight="bold" fontSize="11">Net Quantity:</text>
        <text x="135" y="112" fill="var(--cmp-ink)" fontFamily="Inter, sans-serif" fontSize="11">{isAmul ? '500 mL' : isSunfeast ? '120 g' : isBikano ? '200 g' : '1 L'}</text>

        <text x="50" y="132" fill="var(--cmp-ink)" fontFamily="Inter, sans-serif" fontWeight="bold" fontSize="11">MRP:</text>
        <text x="90" y="132" fill={highlight === 'violation' || isSunfeast ? 'var(--cmp-bad)' : 'var(--cmp-ink)'} fontFamily="Inter, sans-serif" fontWeight={highlight === 'violation' || isSunfeast ? 'bold' : 'normal'} fontSize="11">
          {isSunfeast ? '₹ 25.00' : isAmul ? '₹ 34.00 (incl. of all taxes)' : '₹ 50.00 (incl. of all taxes)'}
        </text>

        {/* Mfg & Best Before */}
        <text x="50" y="152" fill="var(--cmp-ink)" fontFamily="Inter, sans-serif" fontWeight="bold" fontSize="10">Mfg Date:</text>
        <text x="115" y="152" fill="var(--cmp-ink-muted)" fontFamily="Inter, sans-serif" fontSize="10">10/05/2026</text>

        <text x="210" y="152" fill="var(--cmp-ink)" fontFamily="Inter, sans-serif" fontWeight="bold" fontSize="10">Use By:</text>
        <text x="260" y="152" fill="var(--cmp-ink-muted)" fontFamily="Inter, sans-serif" fontSize="10">14/05/2026</text>

        {/* FSSAI Info */}
        <rect x="50" y="165" width="45" height="18" rx="3" fill="var(--cmp-info-soft)" stroke="var(--cmp-map-line)" strokeWidth="1" />
        <text x="56" y="178" fill="var(--cmp-info)" fontFamily="Lexend, sans-serif" fontWeight="bold" fontSize="9">fssai</text>
        <text x="105" y="178" fill="var(--cmp-ink-muted)" fontFamily="monospace" fontSize="10">Lic. No. 10012021000123</text>

        {/* Manufacturer */}
        <text x="50" y="200" fill="var(--cmp-ink)" fontFamily="Inter, sans-serif" fontWeight="bold" fontSize="10">Mfd & Pkd by:</text>
        <text x="135" y="200" fill="var(--cmp-ink-muted)" fontFamily="Inter, sans-serif" fontSize="9">GCMMF Ltd., Anand 388001</text>

        {/* Customer Care */}
        <text x="50" y="218" fill="var(--cmp-ink)" fontFamily="Inter, sans-serif" fontWeight="bold" fontSize="10">Customer Care:</text>
        <text x="145" y="218" fill={isSunfeast ? 'var(--cmp-bad)' : 'var(--cmp-ink-muted)'} fontFamily="Inter, sans-serif" fontSize="9">
          {isSunfeast ? 'Missing Contact' : '1800 258 3333 / care@amul.coop'}
        </text>

        {/* Barcode artwork */}
        <g transform="translate(50, 235)">
          <rect x="0" y="0" width="130" height="42" fill="#fff" rx="4" stroke="var(--cmp-ok-line)" strokeWidth="1" />
          {[2, 5, 8, 12, 16, 18, 22, 26, 30, 32, 36, 40, 44, 48, 52, 58, 62, 66, 70, 75, 80, 85, 90, 95, 100, 106, 112, 118, 122].map((x, i) => (
            <line key={x} x1={x} y1="4" x2={x} y2="30" stroke="var(--cmp-ink)" strokeWidth={i % 3 === 0 ? 2.5 : 1.2} />
          ))}
          <text x="18" y="39" fill="var(--cmp-ink)" fontFamily="monospace" fontSize="8" letterSpacing="2">8901262010052</text>
        </g>

        {/* Veg Symbol */}
        <g transform="translate(305, 238)">
          <rect x="0" y="0" width="32" height="32" rx="4" fill="#fff" stroke="var(--cmp-ok)" strokeWidth="2" />
          <circle cx="16" cy="16" r="8" fill="var(--cmp-ok)" />
        </g>

        {/* Interactive Bounding Box Highlights */}
        {highlight === 'pass' && (
          <g>
            <rect x="30" y="82" width="340" height="215" rx="12" fill="none" stroke="var(--cmp-ok)" strokeWidth="3" strokeDasharray="6 4" />
            <rect x="30" y="82" width="340" height="215" rx="12" fill="var(--cmp-ok-soft)" fillOpacity="0.4" />
            <path d="M30 102V82H50" stroke="var(--cmp-ok)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M370 102V82H350" stroke="var(--cmp-ok)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M30 277V297H50" stroke="var(--cmp-ok)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M370 277V297H350" stroke="var(--cmp-ok)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          </g>
        )}

        {highlight === 'violation' && (
          <g>
            <rect x="42" y="118" width="315" height="24" rx="4" fill="var(--cmp-bad-soft)" stroke="var(--cmp-bad)" strokeWidth="2.5" />
            <rect x="42" y="206" width="315" height="22" rx="4" fill="var(--cmp-bad-soft)" stroke="var(--cmp-bad)" strokeWidth="2.5" />
          </g>
        )}

        {/* Glare specular highlight overlay */}
        {glare && (
          <g>
            <ellipse cx="260" cy="130" rx="130" ry="90" fill="url(#glare-grad)" transform="rotate(-15 260 130)" />
            <line x1="160" y1="50" x2="360" y2="210" stroke="#fff" strokeWidth="3" opacity="0.75" />
            <line x1="200" y1="40" x2="380" y2="180" stroke="#fff" strokeWidth="1.5" opacity="0.6" />
          </g>
        )}
      </svg>
    </div>
  )
}
