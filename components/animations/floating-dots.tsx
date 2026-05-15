'use client'

import { useMemo } from 'react'

interface FloatingDotsProps {
  count?: number
  className?: string
}

export function FloatingDots({ count = 14, className = '' }: FloatingDotsProps) {
  const dots = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const seed = (i + 1) * 9301
        const rand = (n: number) => {
          const x = Math.sin(seed + n) * 10000
          return x - Math.floor(x)
        }
        return {
          left: rand(1) * 100,
          top: rand(2) * 100,
          size: 4 + rand(3) * 10,
          dur: 10 + rand(4) * 14,
          delay: rand(5) * -20,
          hue: [25, 50, 145, 12][Math.floor(rand(6) * 4)],
        }
      }),
    [count],
  )
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {dots.map((d, i) => (
        <span
          key={i}
          className="floating-dot"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: `${d.size}px`,
            height: `${d.size}px`,
            animationDuration: `${d.dur}s`,
            animationDelay: `${d.delay}s`,
            background: `hsla(${d.hue}, 70%, 60%, 0.55)`,
          }}
        />
      ))}
    </div>
  )
}
