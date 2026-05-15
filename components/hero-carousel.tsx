'use client'

import Image from 'next/image'
import Link from 'next/link'
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
  /** Optional URL — when set, the whole pizza becomes a clickable link */
  href?: string
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
  href,
}: HeroCarouselProps) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const dragRef = useRef<{ x: number; y: number; id: number | null; dragged: boolean }>({
    x: 0,
    y: 0,
    id: null,
    dragged: false,
  })
  const suppressClickRef = useRef(false)
  const count = slides.length
  const SWIPE_THRESHOLD = 24

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

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId, dragged: false }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (d.id !== e.pointerId) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      d.dragged = true
    }
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (d.id !== e.pointerId) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (d.dragged && Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      go(index + (dx < 0 ? 1 : -1))
      suppressClickRef.current = true
    }
    dragRef.current = { x: 0, y: 0, id: null, dragged: false }
  }
  // Cancel a pending click if we just finished a swipe gesture
  const onClickCapture = (e: React.MouseEvent) => {
    if (suppressClickRef.current) {
      e.preventDefault()
      e.stopPropagation()
      suppressClickRef.current = false
    }
  }

  if (count === 0) return null

  return (
    <div
      className={`pizza-showcase relative ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={onClickCapture}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Pizza showcase"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Soft warm glow halo behind the pizza */}
      <div className="pizza-showcase-halo" aria-hidden />

      {/* The round stage */}
      {(() => {
        const stage = (
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
                      sizes="(min-width: 1024px) 55vw, 100vw"
                      className="object-contain"
                      priority={i === 0}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )
        return href ? (
          <Link href={href} aria-label={slides[index]?.alt} className="pizza-showcase-link">
            {stage}
          </Link>
        ) : (
          stage
        )
      })()}

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
