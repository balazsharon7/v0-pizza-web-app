'use client'

import { useRef, type ReactNode, type PointerEvent as RPointerEvent } from 'react'

interface TiltCardProps {
  children: ReactNode
  className?: string
  max?: number
  glow?: boolean
}

/**
 * Subtle 3D tilt with cursor-following glow.
 * Wraps children in a div that exposes CSS vars --mx/--my (0..1)
 * and --rx/--ry (deg). Pure CSS sub-effects can read those.
 */
export function TiltCard({ children, className = '', max = 8, glow = true }: TiltCardProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const target = useRef({ rx: 0, ry: 0, mx: 0.5, my: 0.5 })
  const current = useRef({ rx: 0, ry: 0, mx: 0.5, my: 0.5 })

  const animate = () => {
    const el = ref.current
    if (!el) return
    const c = current.current
    const t = target.current
    c.rx += (t.rx - c.rx) * 0.12
    c.ry += (t.ry - c.ry) * 0.12
    c.mx += (t.mx - c.mx) * 0.15
    c.my += (t.my - c.my) * 0.15
    el.style.setProperty('--rx', `${c.rx.toFixed(2)}deg`)
    el.style.setProperty('--ry', `${c.ry.toFixed(2)}deg`)
    el.style.setProperty('--mx', `${(c.mx * 100).toFixed(2)}%`)
    el.style.setProperty('--my', `${(c.my * 100).toFixed(2)}%`)
    if (
      Math.abs(c.rx - t.rx) > 0.01 ||
      Math.abs(c.ry - t.ry) > 0.01 ||
      Math.abs(c.mx - t.mx) > 0.001 ||
      Math.abs(c.my - t.my) > 0.001
    ) {
      rafRef.current = requestAnimationFrame(animate)
    } else {
      rafRef.current = null
    }
  }

  const schedule = () => {
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(animate)
  }

  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    target.current.mx = px
    target.current.my = py
    target.current.ry = (px - 0.5) * 2 * max
    target.current.rx = -(py - 0.5) * 2 * max
    schedule()
  }

  const onLeave = () => {
    target.current.rx = 0
    target.current.ry = 0
    target.current.mx = 0.5
    target.current.my = 0.5
    schedule()
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`tilt-card group/tilt ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="tilt-inner">
        {children}
        {glow && <div className="tilt-glow" aria-hidden />}
      </div>
    </div>
  )
}
