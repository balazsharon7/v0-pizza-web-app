'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'

export interface HeroSlide {
  src: string
  alt: string
  label?: string
}

interface HeroCarouselProps {
  slides: HeroSlide[]
  intervalMs?: number
  className?: string
  /** seconds for one full self-rotation of the pizza image */
  spinSeconds?: number
}

/**
 * Circular pizza showcase: each slide is a round image that spins around its
 * own center, and the carousel crossfades to the next pizza every intervalMs.
 * Pauses on hover/focus. Dots below jump to a specific slide.
 */
export function HeroCarousel({
  slides,
  intervalMs = 5000,
  className = '',
  spinSeconds = 50,
}: HeroCarouselProps) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const count = slides.length

  const go = useCallback(
    (n: number) => {
      if (count === 0) return
      setIndex(((n % count) + count) % count)
    },
    [count],
  )

  useEffect(() => {
    if (paused || count < 2) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count)
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [paused, count, intervalMs])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(index + 1)
    else if (e.key === 'ArrowLeft') go(index - 1)
  }
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1))
    touchStartX.current = null
  }

  if (count === 0) return null

  return (
    <div
      className={`pizza-showcase relative ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Pizza showcase"
    >
      {/* Soft warm glow halo behind the pizza */}
      <div className="pizza-showcase-halo" aria-hidden />

      {/* The round stage */}
      <div className="pizza-showcase-stage">
        {slides.map((s, i) => {
          const active = i === index
          return (
            <div
              key={i}
              className={`pizza-slide ${active ? 'is-active' : ''}`}
              aria-hidden={!active}
            >
              <div
                className="pizza-spin"
                style={{
                  animationDuration: `${spinSeconds}s`,
                  animationPlayState: paused ? 'paused' : 'running',
                }}
              >
                <Image
                  src={s.src}
                  alt={s.alt}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                  priority={i === 0}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Label of currently active pizza */}
      {slides[index]?.label && (
        <div className="pizza-showcase-label">
          <span>{slides[index].label}</span>
        </div>
      )}

      {/* Dots */}
      {count > 1 && (
        <div className="pizza-showcase-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              className={`pizza-dot ${i === index ? 'active' : ''}`}
            >
              <span
                className="pizza-dot-fill"
                style={{
                  animationDuration: `${intervalMs}ms`,
                  animationPlayState: i === index && !paused ? 'running' : 'paused',
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
