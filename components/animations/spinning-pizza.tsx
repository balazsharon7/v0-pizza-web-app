'use client'

/**
 * Decorative spinning pizza emblem.
 * Pure SVG + CSS animation, slow rotate with steam puffs around it.
 */
export function SpinningPizza({ className = '' }: { className?: string }) {
  return (
    <div className={`pizza-emblem ${className}`} aria-hidden>
      <span className="pizza-steam pizza-steam-1" />
      <span className="pizza-steam pizza-steam-2" />
      <span className="pizza-steam pizza-steam-3" />
      <svg viewBox="0 0 200 200" className="pizza-disc" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="crust" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="oklch(0.78 0.12 70)" />
            <stop offset="100%" stopColor="oklch(0.55 0.14 50)" />
          </radialGradient>
          <radialGradient id="sauce" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.62 0.18 30)" />
            <stop offset="100%" stopColor="oklch(0.48 0.16 28)" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="96" fill="url(#crust)" />
        <circle cx="100" cy="100" r="82" fill="url(#sauce)" />
        {/* basil leaves */}
        {[0, 60, 120, 180, 240, 300].map((deg, i) => (
          <ellipse
            key={i}
            cx="100"
            cy="40"
            rx="9"
            ry="14"
            fill="oklch(0.55 0.14 145)"
            transform={`rotate(${deg} 100 100)`}
            opacity={0.92}
          />
        ))}
        {/* mozzarella blobs */}
        {[
          [70, 80, 10],
          [130, 78, 8],
          [85, 130, 9],
          [125, 125, 11],
          [100, 100, 7],
          [60, 110, 7],
          [140, 105, 8],
        ].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="oklch(0.96 0.02 90)" opacity={0.95} />
        ))}
      </svg>
      <div className="pizza-halo" />
    </div>
  )
}
