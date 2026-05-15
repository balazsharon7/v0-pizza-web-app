'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface HeroSlide {
  src: string
  alt: string
  label?: string
}

interface HeroCarouselProps {
  slides: HeroSlide[]
  intervalMs?: number
  className?: string
}

/**
 * Auto-advancing hero pizza carousel.
 * Slides horizontally to the right, pauses on hover/focus, supports
 * arrows + dots + swipe + keyboard arrows.
 */
export function HeroCarousel({ slides, intervalMs = 5000, className = '' }: HeroCarouselProps) {
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
  const next = useCallback(() => go(index + 1), [go, index])
  const prev = useCallback(() => go(index - 1), [go, index])

  useEffect(() => {
    if (paused || count < 2) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count)
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [paused, count, intervalMs])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') next()
    else if (e.key === 'ArrowLeft') prev()
  }

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 40) (dx < 0 ? next : prev)()
    touchStartX.current = null
  }

  if (count === 0) return null

  return (
    <div
      className={`hero-carousel relative overflow-hidden rounded-3xl ${className}`}
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
      <div
        className="hero-carousel-track flex h-full w-full"
        style={{
          transform: `translate3d(-${index * 100}%, 0, 0)`,
          transition: 'transform 800ms cubic-bezier(0.65, 0, 0.35, 1)',
        }}
      >
        {slides.map((s, i) => (
          <div
            key={i}
            className="relative shrink-0 grow-0 basis-full h-full"
            aria-hidden={i !== index}
          >
            <Image
              src={s.src}
              alt={s.alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className={`object-cover transition-transform duration-[6000ms] ease-out ${
                i === index ? 'scale-105' : 'scale-100'
              }`}
              priority={i === 0}
            />
            {/* edge vignette for depth */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.45)_100%)]" />
            {s.label && (
              <div className="absolute bottom-5 left-5 right-5 flex justify-center pointer-events-none">
                <span className="rounded-full bg-background/85 backdrop-blur px-4 py-1.5 text-sm font-serif italic tracking-wide text-foreground shadow-md">
                  {s.label}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* arrows */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="hero-carousel-arrow left-3"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="hero-carousel-arrow right-3"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* dots */}
      {count > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              className={`hero-carousel-dot ${i === index ? 'active' : ''}`}
            >
              <span
                className="hero-carousel-dot-fill"
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
