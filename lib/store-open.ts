import { createClient } from '@/lib/supabase/server'

const TZ = 'Europe/Budapest'

type OpeningHours = Record<string, { open?: string; close?: string; closed?: boolean }>

/** Current weekday (lowercase, e.g. "monday") and minutes-since-midnight in Budapest. */
function budapestNow(): { day: string; minutes: number } {
  const now = new Date()
  const day = now.toLocaleString('en-US', { timeZone: TZ, weekday: 'long' }).toLowerCase()
  const hm = now.toLocaleString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false })
  const [h, m] = hm.split(':').map(Number)
  return { day, minutes: h * 60 + m }
}

/**
 * Authoritative server-side check of whether the restaurant accepts ASAP orders
 * right now: respects the manual `is_open` override and the configured weekly
 * `opening_hours`, evaluated in Budapest time. Used to reject orders placed
 * while closed (scheduled orders are validated separately at checkout).
 */
export async function isStoreOpenNow(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('settings').select('key, value').in('key', ['is_open', 'opening_hours'])

    let manual: boolean | null = null
    let hours: OpeningHours = {}
    for (const row of data ?? []) {
      if (row.key === 'is_open') manual = (row.value as { value?: boolean })?.value ?? null
      if (row.key === 'opening_hours') hours = (row.value as OpeningHours) ?? {}
    }

    // Manual "closed" override always wins.
    if (manual === false) return false

    // No opening hours configured → fall back to open (don't block legitimate orders).
    if (Object.keys(hours).length === 0) return true

    const { day, minutes } = budapestNow()
    const today = hours[day]
    if (!today || today.closed || !today.open || !today.close) return false

    const [oh, om] = today.open.split(':').map(Number)
    const [ch, cm] = today.close.split(':').map(Number)
    return minutes >= oh * 60 + om && minutes < ch * 60 + cm
  } catch {
    // On error, don't hard-block ordering.
    return true
  }
}
