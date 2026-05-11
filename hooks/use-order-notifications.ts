'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Order } from '@/lib/types'

interface UseOrderNotificationsOptions {
  onNewOrder?: (order: Order) => void
  enabled?: boolean
  locale?: 'hu' | 'en'
}

const translations = {
  hu: {
    newOrder: 'Új rendelés érkezett!',
    orderNumber: 'Rendelés száma',
    viewOrder: 'Megtekintés',
  },
  en: {
    newOrder: 'New order received!',
    orderNumber: 'Order number',
    viewOrder: 'View',
  },
}

// Generate notification beep using Web Audio API
function playBeep() {
  if (typeof window === 'undefined') return
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    // Create oscillator for the beep
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800 // Hz
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
    
    // Play second beep
    setTimeout(() => {
      const osc2 = audioContext.createOscillator()
      const gain2 = audioContext.createGain()
      
      osc2.connect(gain2)
      gain2.connect(audioContext.destination)
      
      osc2.frequency.value = 1000 // Higher pitch
      osc2.type = 'sine'
      
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime)
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      osc2.start(audioContext.currentTime)
      osc2.stop(audioContext.currentTime + 0.5)
    }, 200)
  } catch (e) {
    // Audio API not supported, ignore
  }
}

export function useOrderNotifications({ 
  onNewOrder, 
  enabled = true,
  locale = 'hu' 
}: UseOrderNotificationsOptions = {}) {
  const lastOrderIdRef = useRef<string | null>(null)
  const t = translations[locale]

  const playNotificationSound = useCallback(() => {
    playBeep()
  }, [])

  useEffect(() => {
    if (!enabled) return

    const supabase = createClient()

    console.log('[v0] Setting up order notifications subscription...')
    
    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('[v0] New order received via realtime:', payload)
          const newOrder = payload.new as Order
          
          // Prevent duplicate notifications
          if (lastOrderIdRef.current === newOrder.id) return
          lastOrderIdRef.current = newOrder.id

          // Play sound
          playNotificationSound()

          // Show toast notification
          toast.success(t.newOrder, {
            description: `${t.orderNumber}: ${newOrder.order_number}`,
            duration: 10000,
            action: {
              label: t.viewOrder,
              onClick: () => {
                onNewOrder?.(newOrder)
              },
            },
          })

          // Trigger callback
          onNewOrder?.(newOrder)
        }
      )
      .subscribe((status) => {
        console.log('[v0] Subscription status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [enabled, onNewOrder, playNotificationSound, t])

  return { playNotificationSound }
}
