'use client'

import type { ReactNode } from 'react'

interface MarqueeProps {
  items: ReactNode[]
  speed?: number
  className?: string
  reverse?: boolean
}

export function Marquee({ items, speed = 40, className = '', reverse = false }: MarqueeProps) {
  const doubled = [...items, ...items]
  return (
    <div className={`marquee ${className}`} aria-hidden>
      <div
        className="marquee-track"
        style={{
          animationDuration: `${speed}s`,
          animationDirection: reverse ? 'reverse' : 'normal',
        }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="marquee-item">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
