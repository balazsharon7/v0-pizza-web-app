'use client'

import { useEffect, useRef } from 'react'

interface AuroraBgProps {
  className?: string
  intensity?: number
  /** If true, attaches pointer + click listeners to window (good for big backgrounds) */
  globalPointer?: boolean
}

type Ripple = { x: number; y: number; t: number; hue: number }

/**
 * Interactive shader-style background. Soft blurred color blobs drift,
 * follow the pointer, and click anywhere spawns an expanding ripple that
 * temporarily warps the field. Pure 2D canvas — no WebGL needed.
 */
export function AuroraBg({ className = '', intensity = 1, globalPointer = true }: AuroraBgProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const pointerRef = useRef({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, vx: 0, vy: 0 })
  const ripplesRef = useRef<Ripple[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
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

    // Warm Italian palette: olive, terracotta, butter, paprika, sage
    const blobs = [
      { hue: 145, sat: 60, light: 48, r: 0.62, sx: 0.18, sy: 0.42, ax: 0.24, ay: 0.20, ph: 0.0, mag: 1.0 },
      { hue: 25,  sat: 80, light: 58, r: 0.55, sx: 0.34, sy: 0.30, ax: 0.22, ay: 0.24, ph: 1.2, mag: 1.1 },
      { hue: 50,  sat: 75, light: 64, r: 0.50, sx: 0.28, sy: 0.32, ax: 0.20, ay: 0.22, ph: 2.4, mag: 0.9 },
      { hue: 10,  sat: 85, light: 52, r: 0.45, sx: 0.30, sy: 0.40, ax: 0.18, ay: 0.20, ph: 3.6, mag: 1.0 },
      { hue: 80,  sat: 55, light: 60, r: 0.42, sx: 0.25, sy: 0.36, ax: 0.16, ay: 0.18, ph: 4.8, mag: 0.8 },
    ]

    const getRel = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect()
      return {
        x: (clientX - rect.left) / rect.width,
        y: (clientY - rect.top) / rect.height,
        inside:
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom,
      }
    }

    const onPointer = (e: PointerEvent) => {
      const r = getRel(e.clientX, e.clientY)
      if (!globalPointer && !r.inside) return
      pointerRef.current.tx = Math.max(-0.1, Math.min(1.1, r.x))
      pointerRef.current.ty = Math.max(-0.1, Math.min(1.1, r.y))
    }
    const onClick = (e: PointerEvent) => {
      const r = getRel(e.clientX, e.clientY)
      if (!r.inside) return
      ripplesRef.current.push({
        x: r.x,
        y: r.y,
        t: performance.now(),
        hue: [25, 50, 145, 10, 80][Math.floor(Math.random() * 5)],
      })
      // cap ripple list
      if (ripplesRef.current.length > 6) ripplesRef.current.shift()
    }
    const onLeave = () => {
      pointerRef.current.tx = 0.5
      pointerRef.current.ty = 0.5
    }

    const draw = () => {
      t += 0.006
      const p = pointerRef.current
      const prevX = p.x
      const prevY = p.y
      p.x += (p.tx - p.x) * 0.07
      p.y += (p.ty - p.y) * 0.07
      p.vx = p.x - prevX
      p.vy = p.y - prevY

      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'

      const base = Math.min(w, h)
      const now = performance.now()
      const aliveRipples: Ripple[] = []

      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i]
        // each blob is attracted toward the pointer a little, by a different amount
        const attract = 80 * intensity * b.mag
        let cx = w * (b.sx + Math.cos(t + b.ph) * b.ax) + (p.x - 0.5) * attract
        let cy = h * (b.sy + Math.sin(t * 1.25 + b.ph) * b.ay) + (p.y - 0.5) * attract

        // velocity adds a swooshy trail
        cx += p.vx * w * 1.2 * b.mag
        cy += p.vy * h * 1.2 * b.mag

        // ripples push blobs outward
        for (const rip of ripplesRef.current) {
          const age = (now - rip.t) / 1000
          if (age > 1.6) continue
          const rx = rip.x * w
          const ry = rip.y * h
          const dx = cx - rx
          const dy = cy - ry
          const dist = Math.sqrt(dx * dx + dy * dy) + 1
          const wave = Math.sin(age * 6 - dist / 80) * Math.exp(-age * 2)
          const push = (40 * wave) / Math.max(60, dist)
          cx += dx * push
          cy += dy * push
        }

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

      // Draw ripple rings on top, additive
      for (const rip of ripplesRef.current) {
        const age = (now - rip.t) / 1000
        if (age > 1.6) continue
        aliveRipples.push(rip)
        const ringR = 40 + age * base * 0.55
        const alpha = Math.max(0, 0.4 - age * 0.25)
        const grad = ctx.createRadialGradient(
          rip.x * w,
          rip.y * h,
          Math.max(0, ringR - 40),
          rip.x * w,
          rip.y * h,
          ringR + 60,
        )
        grad.addColorStop(0, `hsla(${rip.hue}, 80%, 60%, 0)`)
        grad.addColorStop(0.5, `hsla(${rip.hue}, 80%, 60%, ${alpha})`)
        grad.addColorStop(1, `hsla(${rip.hue}, 80%, 60%, 0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(rip.x * w, rip.y * h, ringR + 60, 0, Math.PI * 2)
        ctx.fill()
      }
      ripplesRef.current = aliveRipples

      raf = requestAnimationFrame(draw)
    }

    resize()
    draw()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const target: EventTarget = globalPointer ? window : canvas
    target.addEventListener('pointermove', onPointer as EventListener, { passive: true })
    target.addEventListener('pointerdown', onClick as EventListener)
    canvas.addEventListener('pointerleave', onLeave)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      target.removeEventListener('pointermove', onPointer as EventListener)
      target.removeEventListener('pointerdown', onClick as EventListener)
      canvas.removeEventListener('pointerleave', onLeave)
    }
  }, [intensity, globalPointer])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  )
}
