'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Clock, 
  Check, 
  ChefHat, 
  Package, 
  Truck, 
  X,
  MapPin,
  Phone,
  Store
} from 'lucide-react'
import { formatPrice, type Order, type OrderStatus } from '@/lib/types'
import type { Locale } from '@/lib/i18n/config'

interface OrderTrackerProps {
  initialOrder: Order
  locale: Locale
}

const statusConfig: Record<OrderStatus, { 
  icon: typeof Clock
  color: string
  bgColor: string
}> = {
  pending: { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  confirmed: { icon: Check, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  preparing: { icon: ChefHat, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  ready: { icon: Package, color: 'text-green-600', bgColor: 'bg-green-100' },
  delivering: { icon: Truck, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  completed: { icon: Check, color: 'text-gray-600', bgColor: 'bg-gray-100' },
  cancelled: { icon: X, color: 'text-red-600', bgColor: 'bg-red-100' },
}

const translations = {
  hu: {
    tracking: 'Rendelés követése',
    orderNumber: 'Rendelés száma',
    status: {
      pending: 'Függőben',
      confirmed: 'Visszaigazolva',
      preparing: 'Készül',
      ready: 'Elkészült',
      delivering: 'Kiszállítás alatt',
      completed: 'Teljesítve',
      cancelled: 'Törölve',
    },
    statusDesc: {
      pending: 'Rendelését megkaptuk, hamarosan visszaigazoljuk.',
      confirmed: 'Rendelését visszaigazoltuk, hamarosan elkezdünk készülni.',
      preparing: 'Rendelése most készül a konyhában.',
      ready: 'Rendelése elkészült, hamarosan indul a kiszállítás.',
      delivering: 'Futárunk úton van Önhöz!',
      completed: 'Rendelése sikeresen teljesítve. Jó étvágyat!',
      cancelled: 'Rendelését töröltük.',
    },
    delivery: 'Házhozszállítás',
    pickup: 'Személyes átvétel',
    estimatedTime: 'Becsült idő',
    minutes: 'perc',
    orderDetails: 'Rendelés részletei',
    deliveryAddress: 'Szállítási cím',
    contact: 'Kapcsolat',
    items: 'Tételek',
    subtotal: 'Részösszeg',
    deliveryFee: 'Szállítási díj',
    total: 'Összesen',
    free: 'Ingyenes',
    pickupAddress: 'Átvételi cím',
    restaurantAddress: 'Budaörs, Fő utca 1.',
  },
  en: {
    tracking: 'Order Tracking',
    orderNumber: 'Order Number',
    status: {
      pending: 'Pending',
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      ready: 'Ready',
      delivering: 'Out for Delivery',
      completed: 'Completed',
      cancelled: 'Cancelled',
    },
    statusDesc: {
      pending: 'We received your order, we will confirm it shortly.',
      confirmed: 'Your order is confirmed, we will start preparing soon.',
      preparing: 'Your order is being prepared in the kitchen.',
      ready: 'Your order is ready, delivery will start soon.',
      delivering: 'Our courier is on the way to you!',
      completed: 'Your order has been delivered. Enjoy your meal!',
      cancelled: 'Your order has been cancelled.',
    },
    delivery: 'Delivery',
    pickup: 'Pickup',
    estimatedTime: 'Estimated time',
    minutes: 'minutes',
    orderDetails: 'Order Details',
    deliveryAddress: 'Delivery Address',
    contact: 'Contact',
    items: 'Items',
    subtotal: 'Subtotal',
    deliveryFee: 'Delivery Fee',
    total: 'Total',
    free: 'Free',
    pickupAddress: 'Pickup Address',
    restaurantAddress: 'Budaörs, Fő utca 1.',
  },
}

// Order flow for the timeline (excluding cancelled)
const orderFlow: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'completed']
const pickupFlow: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'completed']

export function OrderTracker({ initialOrder, locale }: OrderTrackerProps) {
  const [order, setOrder] = useState<Order>(initialOrder)
  const t = translations[locale]
  
  const flow = order.delivery_type === 'pickup' ? pickupFlow : orderFlow
  const currentIndex = flow.indexOf(order.status)
  const isCancelled = order.status === 'cancelled'

  useEffect(() => {
    const supabase = createClient()
    
    // Subscribe to order updates
    const channel = supabase
      .channel(`order-${order.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          setOrder((prev) => ({ ...prev, ...payload.new }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [order.id])

  const config = statusConfig[order.status]
  const StatusIcon = config.icon

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <Card className="overflow-hidden">
        <div className={`${config.bgColor} p-6`}>
          <div className="flex items-center gap-4">
            <div className={`rounded-full bg-background p-3 ${config.color}`}>
              <StatusIcon className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-medium opacity-75">
                {t.orderNumber}: {order.order_number}
              </p>
              <h2 className="text-2xl font-serif font-bold">
                {t.status[order.status]}
              </h2>
            </div>
          </div>
          <p className="mt-4 text-sm opacity-90">
            {t.statusDesc[order.status]}
          </p>
        </div>
        
        <CardContent className="p-6">
          {/* Timeline */}
          {!isCancelled && (
            <div className="mb-6">
              <div className="flex items-center justify-between">
                {flow.map((status, index) => {
                  const isActive = index <= currentIndex
                  const isCurrentStep = index === currentIndex
                  const StepIcon = statusConfig[status].icon
                  
                  return (
                    <div key={status} className="flex flex-col items-center flex-1">
                      <div className="relative flex items-center w-full">
                        {/* Line before */}
                        {index > 0 && (
                          <div 
                            className={`absolute left-0 right-1/2 h-1 -translate-y-1/2 top-1/2 ${
                              isActive ? 'bg-accent' : 'bg-muted'
                            }`}
                          />
                        )}
                        {/* Line after */}
                        {index < flow.length - 1 && (
                          <div 
                            className={`absolute left-1/2 right-0 h-1 -translate-y-1/2 top-1/2 ${
                              index < currentIndex ? 'bg-accent' : 'bg-muted'
                            }`}
                          />
                        )}
                        {/* Circle */}
                        <div 
                          className={`relative z-10 mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                            isCurrentStep 
                              ? 'border-accent bg-accent text-accent-foreground scale-110' 
                              : isActive 
                                ? 'border-accent bg-accent text-accent-foreground'
                                : 'border-muted bg-background text-muted-foreground'
                          }`}
                        >
                          <StepIcon className="h-5 w-5" />
                        </div>
                      </div>
                      <span className={`mt-2 text-xs text-center ${
                        isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
                      }`}>
                        {t.status[status]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Estimated Time */}
          {!isCancelled && order.status !== 'completed' && (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-muted p-4 mb-6">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">{t.estimatedTime}:</span>
              <span className="font-bold">
                {order.delivery_type === 'pickup' ? '30' : '60'} {t.minutes}
              </span>
            </div>
          )}

          <Separator className="my-6" />

          {/* Order Info */}
          <div className="space-y-4">
            <h3 className="font-serif font-semibold">{t.orderDetails}</h3>
            
            {/* Delivery/Pickup Info */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2">
                {order.delivery_type === 'delivery' ? (
                  <Truck className="h-5 w-5 text-accent" />
                ) : (
                  <Store className="h-5 w-5 text-accent" />
                )}
                <span className="font-medium">
                  {order.delivery_type === 'delivery' ? t.delivery : t.pickup}
                </span>
              </div>
              
              {order.delivery_type === 'delivery' && order.delivery_address && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    {order.delivery_address}, {order.delivery_zip} {order.delivery_city}
                  </span>
                </div>
              )}
              
              {order.delivery_type === 'pickup' && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{t.restaurantAddress}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                <span>{order.customer_phone}</span>
              </div>
            </div>

            {/* Price Summary */}
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t.subtotal}</span>
                <span>{formatPrice(order.subtotal)} Ft</span>
              </div>
              {order.delivery_type === 'delivery' && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t.deliveryFee}</span>
                  <span>{order.delivery_fee > 0 ? `${formatPrice(order.delivery_fee)} Ft` : t.free}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>{t.total}</span>
                <span className="text-accent">{formatPrice(order.total)} Ft</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
