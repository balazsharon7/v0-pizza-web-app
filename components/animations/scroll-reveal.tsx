'use client'

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  once?: boolean
}

export function ScrollReveal({
  children,
  delay = 0,
  y = 28,
  className = '',
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true)
            if (once) io.disconnect()
          } else if (!once) {
            setShown(false)
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [once])

  const style: CSSProperties = {
    transform: shown ? 'translate3d(0,0,0)' : `translate3d(0,${y}px,0)`,
    opacity: shown ? 1 : 0,
    transition: `transform 800ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, opacity 800ms ease ${delay}ms`,
    willChange: 'transform, opacity',
  }

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  )
}
