'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type OpeningHours = {
  [key: string]: { open: string; close: string; closed?: boolean }
}

const fallback: OpeningHours = {
  monday:    { open: '11:00', close: '22:00' },
  tuesday:   { open: '11:00', close: '22:00' },
  wednesday: { open: '11:00', close: '22:00' },
  thursday:  { open: '11:00', close: '22:00' },
  friday:    { open: '11:00', close: '23:00' },
  saturday:  { open: '12:00', close: '23:00' },
  sunday:    { open: '12:00', close: '21:00' },
}

function checkOpen(hours: OpeningHours, override: boolean | null): boolean {
  if (override === false) return false
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const day = days[new Date().getDay()]
  const h = hours[day]
  if (!h || h.closed) return false
  const now = new Date()
  const [oh, om] = h.open.split(':').map(Number)
  const [ch, cm] = h.close.split(':').map(Number)
  const open  = new Date(now); open.setHours(oh, om, 0, 0)
  const close = new Date(now); close.setHours(ch, cm, 0, 0)
  return now >= open && now < close
}

interface HeroSignProps {
  className?: string
}

export function HeroSign({ className = '' }: HeroSignProps) {
  const [isOpen, setIsOpen] = useState<boolean | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [{ data: hoursData }, { data: overrideData }] = await Promise.all([
        supabase.from('settings').select('value').eq('key', 'opening_hours').single(),
        supabase.from('settings').select('value').eq('key', 'is_open').single(),
      ])
      const hours = (hoursData?.value && Object.keys(hoursData.value).length
        ? hoursData.value
        : fallback) as OpeningHours
      const override = (overrideData?.value as { value: boolean } | null)?.value ?? null
      setIsOpen(checkOpen(hours, override))
    }
    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [supabase])

  // Don't render until we know the status (avoids flash)
  if (isOpen === null) return null

  return (
    <div className={`hero-sign ${className}`} aria-label={isOpen ? 'Nyitva' : 'Zárva'}>
      <Image
        src={isOpen ? '/hero/sign-open.svg' : '/hero/sign-closed.svg'}
        alt={isOpen ? 'Nyitva' : 'Zárva'}
        width={500}
        height={560}
        className="w-full h-full object-contain drop-shadow-2xl"
        priority={false}
      />
    </div>
  )
}
