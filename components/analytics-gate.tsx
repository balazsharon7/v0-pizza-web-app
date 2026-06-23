'use client'

import { useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/next'
import { CONSENT_EVENT, hasAnalyticsConsent } from '@/lib/consent'

/**
 * Loads Vercel Web Analytics only after the visitor has given analytics
 * consent (and only in production). Reacts live to consent changes, so
 * analytics starts/stops the moment the visitor accepts or declines —
 * without a page reload.
 */
export function AnalyticsGate() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const sync = () => setEnabled(hasAnalyticsConsent())
    sync()
    window.addEventListener(CONSENT_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(CONSENT_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  if (process.env.NODE_ENV !== 'production' || !enabled) return null
  return <Analytics />
}
