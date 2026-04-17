'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type OpeningHours = {
  [key: string]: { open: string; close: string; closed?: boolean }
}

interface OpenStatusProps {
  locale: string
  showHours?: boolean
}

const dayNames: Record<string, { hu: string; en: string }> = {
  monday: { hu: 'Hétfő', en: 'Monday' },
  tuesday: { hu: 'Kedd', en: 'Tuesday' },
  wednesday: { hu: 'Szerda', en: 'Wednesday' },
  thursday: { hu: 'Csütörtök', en: 'Thursday' },
  friday: { hu: 'Péntek', en: 'Friday' },
  saturday: { hu: 'Szombat', en: 'Saturday' },
  sunday: { hu: 'Vasárnap', en: 'Sunday' },
}

const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

function getCurrentDay(): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[new Date().getDay()]
}

function isCurrentlyOpen(hours: OpeningHours, manualOverride: boolean | null): { isOpen: boolean; closesAt?: string; opensAt?: string } {
  // If manually closed, return closed
  if (manualOverride === false) {
    return { isOpen: false }
  }
  
  const now = new Date()
  const currentDay = getCurrentDay()
  const todayHours = hours[currentDay]
  
  if (!todayHours || todayHours.closed) {
    // Find next open day
    const todayIndex = dayOrder.indexOf(currentDay)
    for (let i = 1; i <= 7; i++) {
      const nextDay = dayOrder[(todayIndex + i) % 7]
      const nextHours = hours[nextDay]
      if (nextHours && !nextHours.closed) {
        return { isOpen: false, opensAt: `${dayNames[nextDay].hu} ${nextHours.open}` }
      }
    }
    return { isOpen: false }
  }
  
  const [openHour, openMin] = todayHours.open.split(':').map(Number)
  const [closeHour, closeMin] = todayHours.close.split(':').map(Number)
  
  const openTime = new Date(now)
  openTime.setHours(openHour, openMin, 0, 0)
  
  const closeTime = new Date(now)
  closeTime.setHours(closeHour, closeMin, 0, 0)
  
  const isOpen = now >= openTime && now < closeTime
  
  if (isOpen) {
    return { isOpen: true, closesAt: todayHours.close }
  } else if (now < openTime) {
    return { isOpen: false, opensAt: todayHours.open }
  } else {
    // After closing, find next open time
    const todayIndex = dayOrder.indexOf(currentDay)
    for (let i = 1; i <= 7; i++) {
      const nextDay = dayOrder[(todayIndex + i) % 7]
      const nextHours = hours[nextDay]
      if (nextHours && !nextHours.closed) {
        return { isOpen: false, opensAt: `${dayNames[nextDay].hu} ${nextHours.open}` }
      }
    }
    return { isOpen: false }
  }
}

export function OpenStatus({ locale, showHours = false }: OpenStatusProps) {
  const [openingHours, setOpeningHours] = useState<OpeningHours | null>(null)
  const [manualOverride, setManualOverride] = useState<boolean | null>(null)
  const [status, setStatus] = useState<{ isOpen: boolean; closesAt?: string; opensAt?: string } | null>(null)
  
  const supabase = createClient()
  
  useEffect(() => {
    const fetchSettings = async () => {
      const { data: hoursData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'opening_hours')
        .single()
      
      const { data: overrideData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'is_open')
        .single()
      
      if (hoursData) {
        setOpeningHours(hoursData.value as OpeningHours)
      }
      
      if (overrideData) {
        setManualOverride((overrideData.value as { value: boolean }).value)
      }
    }
    
    fetchSettings()
    
    // Update status every minute
    const interval = setInterval(fetchSettings, 60000)
    return () => clearInterval(interval)
  }, [supabase])
  
  useEffect(() => {
    if (openingHours) {
      setStatus(isCurrentlyOpen(openingHours, manualOverride))
      
      // Update status every minute
      const interval = setInterval(() => {
        setStatus(isCurrentlyOpen(openingHours, manualOverride))
      }, 60000)
      
      return () => clearInterval(interval)
    }
  }, [openingHours, manualOverride])
  
  if (!status) {
    return null
  }
  
  const t = {
    open: locale === 'hu' ? 'Nyitva' : 'Open',
    closed: locale === 'hu' ? 'Zárva' : 'Closed',
    closesAt: locale === 'hu' ? 'Zárás:' : 'Closes at:',
    opensAt: locale === 'hu' ? 'Nyitás:' : 'Opens at:',
    openingHours: locale === 'hu' ? 'Nyitvatartás' : 'Opening Hours',
  }
  
  const currentDay = getCurrentDay()
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer">
            <Badge 
              variant={status.isOpen ? 'default' : 'secondary'}
              className={status.isOpen 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
              }
            >
              <span className={`mr-1.5 h-2 w-2 rounded-full ${status.isOpen ? 'bg-green-300 animate-pulse' : 'bg-red-300'}`} />
              {status.isOpen ? t.open : t.closed}
            </Badge>
            {status.isOpen && status.closesAt && (
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {t.closesAt} {status.closesAt}
              </span>
            )}
            {!status.isOpen && status.opensAt && (
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {t.opensAt} {status.opensAt}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="w-64 p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <Clock className="h-4 w-4" />
              {t.openingHours}
            </div>
            <div className="space-y-1 text-sm">
              {openingHours && dayOrder.map((day) => {
                const hours = openingHours[day]
                const isToday = day === currentDay
                return (
                  <div 
                    key={day} 
                    className={`flex justify-between ${isToday ? 'font-semibold text-primary' : ''}`}
                  >
                    <span>{dayNames[day][locale as 'hu' | 'en']}</span>
                    <span>
                      {hours?.closed 
                        ? (locale === 'hu' ? 'Zárva' : 'Closed')
                        : `${hours?.open} - ${hours?.close}`
                      }
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
