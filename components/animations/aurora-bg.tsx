'use client'

import { useEffect, useRef } from 'react'

interface AuroraBgProps {
  className?: string
  intensity?: number
}

/**
 * Interactive aurora/heat-haze canvas background.
 * Soft blurred blobs drift, react to pointer, evoke a wood-fired oven glow.
 */
export function AuroraBg({ className = '', intensity = 1 }: AuroraBgProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const pointerRef = useRef({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    let raf = 0
    let t = 0

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const blobs = [
      { hue: 145, sat: 55, light: 45, r: 0.55, sx: 0.18, sy: 0.45, ax: 0.22, ay: 0.18, ph: 0.0 },
      { hue: 25,  sat: 75, light: 55, r: 0.5,  sx: 0.32, sy: 0.36, ax: 0.20, ay: 0.22, ph: 1.2 },
      { hue: 50,  sat: 70, light: 60, r: 0.45, sx: 0.26, sy: 0.30, ax: 0.18, ay: 0.20, ph: 2.4 },
      { hue: 12,  sat: 80, light: 50, r: 0.4,  sx: 0.28, sy: 0.40, ax: 0.16, ay: 0.18, ph: 3.6 },
    ]

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointerRef.current.tx = (e.clientX - rect.left) / rect.width
      pointerRef.current.ty = (e.clientY - rect.top) / rect.height
    }
    const onLeave = () => {
      pointerRef.current.tx = 0.5
      pointerRef.current.ty = 0.5
    }

    const draw = () => {
      t += 0.006
      const p = pointerRef.current
      p.x += (p.tx - p.x) * 0.06
      p.y += (p.ty - p.y) * 0.06

      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'

      const base = Math.min(w, h)
      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i]
        const cx = w * (b.sx + Math.cos(t + b.ph) * b.ax) + (p.x - 0.5) * 60 * intensity
        const cy = h * (b.sy + Math.sin(t * 1.3 + b.ph) * b.ay) + (p.y - 0.5) * 60 * intensity
        const radius = base * b.r * (0.9 + 0.1 * Math.sin(t * 1.7 + b.ph))
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
        grad.addColorStop(0, `hsla(${b.hue}, ${b.sat}%, ${b.light}%, ${0.55 * intensity})`)
        grad.addColorStop(0.5, `hsla(${b.hue}, ${b.sat}%, ${b.light}%, ${0.18 * intensity})`)
        grad.addColorStop(1, `hsla(${b.hue}, ${b.sat}%, ${b.light}%, 0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      raf = requestAnimationFrame(draw)
    }

    resize()
    draw()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    window.addEventListener('pointermove', onPointer, { passive: true })
    canvas.addEventListener('pointerleave', onLeave)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('pointermove', onPointer)
      canvas.removeEventListener('pointerleave', onLeave)
    }
  }, [intensity])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  )
}
