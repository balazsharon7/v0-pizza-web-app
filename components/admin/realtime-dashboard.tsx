'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Locale } from '@/lib/i18n/config'

interface RealtimeDashboardProps {
  children: React.ReactNode
  locale: Locale
}

// Generate notification beep using Web Audio API
function playBeep() {
  if (typeof window === 'undefined') return
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
    
    setTimeout(() => {
      const osc2 = audioContext.createOscillator()
      const gain2 = audioContext.createGain()
      
      osc2.connect(gain2)
      gain2.connect(audioContext.destination)
      
      osc2.frequency.value = 1000
      osc2.type = 'sine'
      
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime)
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      osc2.start(audioContext.currentTime)
      osc2.stop(audioContext.currentTime + 0.5)
    }, 200)
  } catch (e) {
    // Audio API not supported
  }
}

const translations = {
  hu: {
    newOrder: 'Új rendelés érkezett!',
    orderNumber: 'Rendelés száma',
  },
  en: {
    newOrder: 'New order received!',
    orderNumber: 'Order number',
  },
}

export function RealtimeDashboard({ children, locale }: RealtimeDashboardProps) {
  const router = useRouter()
  const t = translations[locale]

  const handleRefresh = useCallback(() => {
    router.refresh()
  }, [router])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('dashboard-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const newOrder = payload.new as { order_number: string }
          
          // Play sound
          playBeep()

          // Show toast
          toast.success(t.newOrder, {
            description: `${t.orderNumber}: ${newOrder.order_number}`,
            duration: 10000,
          })

          // Refresh the page data
          handleRefresh()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        () => {
          // Refresh on status updates too
          handleRefresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [handleRefresh, t])

  return <>{children}</>
}
