'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

type OpeningHours = {
  [key: string]: { open: string; close: string; closed?: boolean }
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

function checkIsOpen(hours: OpeningHours, manualOverride: boolean | null): { isOpen: boolean; nextOpenTime?: string } {
  if (manualOverride === false) {
    return { isOpen: false }
  }
  
  const now = new Date()
  const currentDay = getCurrentDay()
  const todayHours = hours[currentDay]
  
  if (!todayHours || todayHours.closed) {
    const todayIndex = dayOrder.indexOf(currentDay)
    for (let i = 1; i <= 7; i++) {
      const nextDay = dayOrder[(todayIndex + i) % 7]
      const nextHours = hours[nextDay]
      if (nextHours && !nextHours.closed) {
        return { isOpen: false, nextOpenTime: `${dayNames[nextDay].hu} ${nextHours.open}` }
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
    return { isOpen: true }
  } else if (now < openTime) {
    return { isOpen: false, nextOpenTime: todayHours.open }
  } else {
    const todayIndex = dayOrder.indexOf(currentDay)
    for (let i = 1; i <= 7; i++) {
      const nextDay = dayOrder[(todayIndex + i) % 7]
      const nextHours = hours[nextDay]
      if (nextHours && !nextHours.closed) {
        return { isOpen: false, nextOpenTime: `${dayNames[nextDay].hu} ${nextHours.open}` }
      }
    }
    return { isOpen: false }
  }
}

interface ClosedStoreAlertProps {
  locale: string
  onStatusChange?: (isOpen: boolean) => void
}

export function ClosedStoreAlert({ locale, onStatusChange }: ClosedStoreAlertProps) {
  const [showAlert, setShowAlert] = useState(false)
  const [nextOpenTime, setNextOpenTime] = useState<string | undefined>()
  const [hasShown, setHasShown] = useState(false)
  
  const supabase = createClient()
  
  useEffect(() => {
    const checkStatus = async () => {
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
        const hours = hoursData.value as OpeningHours
        const manualOverride = overrideData ? (overrideData.value as { value: boolean }).value : null
        const status = checkIsOpen(hours, manualOverride)
        
        onStatusChange?.(status.isOpen)
        
        if (!status.isOpen && !hasShown) {
          setNextOpenTime(status.nextOpenTime)
          setShowAlert(true)
          setHasShown(true)
        }
      }
    }
    
    checkStatus()
  }, [supabase, hasShown, onStatusChange])
  
  const t = {
    title: locale === 'hu' ? 'Jelenleg zárva vagyunk' : 'We are currently closed',
    description: locale === 'hu' 
      ? 'Sajnos most nem tudunk rendelést fogadni. Kérjük, látogass vissza nyitvatartási időben!'
      : 'Unfortunately, we cannot accept orders at this time. Please visit us during opening hours!',
    nextOpen: locale === 'hu' ? 'Legközelebb nyitunk:' : 'Next opening:',
    ok: locale === 'hu' ? 'Értem' : 'Got it',
  }
  
  return (
    <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <AlertDialogTitle className="text-center text-xl">
            {t.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {t.description}
          </AlertDialogDescription>
          {nextOpenTime && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-primary" />
              <span>{t.nextOpen}</span>
              <span className="text-primary">{nextOpenTime}</span>
            </div>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <Button onClick={() => setShowAlert(false)} className="min-w-32">
            {t.ok}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function useStoreStatus() {
  const [isOpen, setIsOpen] = useState<boolean | null>(null)
  const supabase = createClient()
  
  useEffect(() => {
    const checkStatus = async () => {
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
        const hours = hoursData.value as OpeningHours
        const manualOverride = overrideData ? (overrideData.value as { value: boolean }).value : null
        const status = checkIsOpen(hours, manualOverride)
        setIsOpen(status.isOpen)
      }
    }
    
    checkStatus()
    const interval = setInterval(checkStatus, 60000)
    return () => clearInterval(interval)
  }, [supabase])
  
  return isOpen
}
