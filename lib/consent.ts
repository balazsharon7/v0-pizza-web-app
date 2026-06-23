export const CONSENT_KEY = 'terra-verde-cookie-consent'
export const CONSENT_EVENT = 'tv-consent-changed'

export interface Consent {
  /** Anonymous statistics (Vercel Web Analytics). Necessary cookies are always on. */
  analytics: boolean
}

/**
 * Reads the stored consent. Returns null if the visitor hasn't chosen yet.
 * Backwards-compatible with the previous 'accepted' / 'declined' string values.
 */
export function getConsent(): Consent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    if (!raw) return null
    if (raw === 'accepted') return { analytics: true }
    if (raw === 'declined') return { analytics: false }
    const parsed = JSON.parse(raw)
    return { analytics: !!parsed.analytics }
  } catch {
    return null
  }
}

/** Persists the visitor's choice and notifies listeners (e.g. the analytics gate). */
export function setConsent(consent: Consent): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CONSENT_KEY, JSON.stringify({ ...consent, ts: Date.now() }))
  window.dispatchEvent(new Event(CONSENT_EVENT))
}

export function hasAnalyticsConsent(): boolean {
  return getConsent()?.analytics === true
}
