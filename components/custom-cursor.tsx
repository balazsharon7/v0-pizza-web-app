'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

type CursorState = 'default' | 'hover' | 'active'

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], select, label[for], summary, input[type="checkbox"], input[type="radio"], input[type="submit"], [data-cursor="hover"]'

export function CustomCursor() {
  const pathname = usePathname()
  const cursorRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<CursorState>('default')
  const [visible, setVisible] = useState(false)
  const [active, setActive] = useState(false)

  // Disable on admin pages (productivity-friendly)
  const isAdminPage = pathname?.includes('/admin')

  useEffect(() => {
    if (isAdminPage) return

    // Touch device detection — skip on mobile/tablet
    const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches
    if (isTouch) return

    // Mark as active so the cursor element is mounted, then grab ref
    setActive(true)
  }, [isAdminPage])

  // Second effect: attach listeners once the div is in the DOM
  useEffect(() => {
    if (!active || isAdminPage) return

    const cursor = cursorRef.current
    if (!cursor) return

    document.body.classList.add('custom-cursor-active')

    let isDown = false

    const checkInteractive = (target: Element | null) => {
      if (!target) return false
      return target.closest(INTERACTIVE_SELECTOR) !== null
    }

    const onMove = (e: PointerEvent) => {
      cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
      setVisible(true)
      if (!isDown) {
        setState(checkInteractive(e.target as Element) ? 'hover' : 'default')
      }
    }

    const onDown = () => {
      isDown = true
      setState('active')
    }

    const onUp = (e: PointerEvent) => {
      isDown = false
      setState(checkInteractive(e.target as Element) ? 'hover' : 'default')
    }

    const onLeaveWindow = () => setVisible(false)
    const onEnterWindow = () => setVisible(true)

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    document.addEventListener('mouseleave', onLeaveWindow)
    document.addEventListener('mouseenter', onEnterWindow)

    return () => {
      document.body.classList.remove('custom-cursor-active')
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.removeEventListener('mouseleave', onLeaveWindow)
      document.removeEventListener('mouseenter', onEnterWindow)
    }
  }, [active, isAdminPage])

  if (!active || isAdminPage) return null

  return (
    <div
      ref={cursorRef}
      aria-hidden
      className="custom-cursor fixed top-0 left-0 pointer-events-none z-[9999] will-change-transform"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 200ms ease',
      }}
    >
      {/* Inner wrapper handles rotation + scale; outer div handles position */}
      <div
        style={{
          width: '44px',
          height: '44px',
          // Rotate so the pizza tip points upper-left like a standard cursor arrow.
          // translate() shifts the hotspot (tip) to align with the actual click point.
          transform: `translate(-10px, -8px) rotate(-135deg) ${state === 'active' ? 'scale(0.82)' : 'scale(1)'}`,
          transformOrigin: 'center',
          transition: 'transform 120ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/cursors/cursor-${state}.png`}
          alt=""
          width={44}
          height={44}
          draggable={false}
          className="select-none block"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>

      {/* Preload other states so transitions are instant */}
      <div className="hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cursors/cursor-default.png" alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cursors/cursor-hover.png" alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cursors/cursor-active.png" alt="" />
      </div>
    </div>
  )
}
