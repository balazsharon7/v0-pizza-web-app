'use client'

import { useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { useOrderNotifications } from '@/hooks/use-order-notifications'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatPrice, getLocalizedName, type Order, type OrderStatus } from '@/lib/types'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/get-dictionary'
import { updateOrderStatus } from './actions'
import { Truck, Store, Phone, MapPin, Clock, Check, X, ChefHat, Package, ArrowRight, Calendar, Search, CalendarClock, Banknote, CreditCard } from 'lucide-react'

interface OrdersListProps {
  orders: Order[]
  locale: Locale
  dictionary: Dictionary
  initialFromDate?: string
  initialToDate?: string
}

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  preparing: 'bg-orange-100 text-orange-800 border-orange-200',
  ready: 'bg-green-100 text-green-800 border-green-200',
  delivering: 'bg-purple-100 text-purple-800 border-purple-200',
  completed: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
}

const statusIcons: Record<OrderStatus, typeof Clock> = {
  pending: Clock,
  confirmed: Check,
  preparing: ChefHat,
  ready: Package,
  delivering: Truck,
  completed: Check,
  cancelled: X,
}

// Left accent stripe colour per status, so an order's state is readable at a glance.
const statusAccent: Record<OrderStatus, string> = {
  pending: 'bg-yellow-400',
  confirmed: 'bg-blue-400',
  preparing: 'bg-orange-400',
  ready: 'bg-green-500',
  delivering: 'bg-purple-400',
  completed: 'bg-gray-300',
  cancelled: 'bg-red-400',
}

const statuses: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'delivering',
  'completed',
  'cancelled',
]

export function OrdersList({ orders, locale, dictionary, initialFromDate, initialToDate }: OrdersListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const t = dictionary
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isUpdating, setIsUpdating] = useState(false)
  const [fromDate, setFromDate] = useState(initialFromDate || '')
  const [toDate, setToDate] = useState(initialToDate || '')

  // Handle new order notification
  const handleNewOrder = useCallback(() => {
    router.refresh()
  }, [router])

  // Enable real-time notifications for new orders
  useOrderNotifications({
    onNewOrder: handleNewOrder,
    enabled: true,
    locale,
  })

  const handleDateFilter = () => {
    const params = new URLSearchParams()
    if (fromDate) params.set('from', fromDate)
    if (toDate) params.set('to', toDate)
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleShowToday = () => {
    const today = new Date().toISOString().split('T')[0]
    setFromDate(today)
    setToDate(today)
    router.push(`${pathname}?from=${today}&to=${today}`)
  }

  const handleShowAll = () => {
    setFromDate('')
    setToDate('')
    router.push(pathname)
  }

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter((o) => o.status === filterStatus)

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setIsUpdating(true)
    try {
      const result = await updateOrderStatus(orderId, newStatus)
      if (result.success) {
        toast.success(locale === 'hu' ? 'Státusz frissítve' : 'Status updated')
        if (selectedOrder) {
          setSelectedOrder({ ...selectedOrder, status: newStatus })
        }
        router.refresh()
      } else {
        throw new Error(result.error)
      }
    } catch {
      toast.error(locale === 'hu' ? 'Hiba történt' : 'Error occurred')
    } finally {
      setIsUpdating(false)
    }
  }

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const flow: Record<OrderStatus, OrderStatus | null> = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'delivering',
      delivering: 'completed',
      completed: null,
      cancelled: null,
    }
    return flow[currentStatus]
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(locale === 'hu' ? 'hu-HU' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDateLong = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(locale === 'hu' ? 'hu-HU' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <>
      {/* Date Range Filter */}
      <Card className="mb-4">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {locale === 'hu' ? 'Dátumtól' : 'From Date'}
              </Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-12 w-full"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {locale === 'hu' ? 'Dátumig' : 'To Date'}
              </Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-12 w-full"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleDateFilter} className="flex-1 sm:flex-none h-11">
              <Search className="h-4 w-4 mr-2" />
              {locale === 'hu' ? 'Keresés' : 'Search'}
            </Button>
            <Button variant="outline" onClick={handleShowToday} className="flex-1 sm:flex-none h-11">
              <Calendar className="h-4 w-4 mr-2" />
              {locale === 'hu' ? 'Ma' : 'Today'}
            </Button>
            <Button variant="ghost" onClick={handleShowAll} className="flex-1 sm:flex-none h-11">
              {locale === 'hu' ? 'Összes' : 'All'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Filter - Mobile Friendly */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[200px] h-12">
            <SelectValue placeholder={locale === 'hu' ? 'Szűrés státusz' : 'Filter by status'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{locale === 'hu' ? 'Összes' : 'All'}</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                {t.orders.status[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Quick filter badges */}
        <div className="flex flex-wrap gap-2">
          {(['pending', 'confirmed', 'preparing', 'ready'] as OrderStatus[]).map((status) => {
            const count = orders.filter((o) => o.status === status).length
            if (count === 0) return null
            return (
              <Button
                key={status}
                variant={filterStatus === status ? 'default' : 'outline'}
                size="sm"
                className="h-10"
                onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
              >
                {t.orders.status[status]} ({count})
              </Button>
            )
          })}
        </div>
      </div>

      {/* Orders Grid - Mobile Optimized */}
      <div className="grid gap-3">
        {filteredOrders.map((order) => {
          const StatusIcon = statusIcons[order.status]
          const nextStatus = getNextStatus(order.status)
          
          const itemSummary = (order.items ?? [])
            .map((i) => `${i.quantity}× ${i.product ? getLocalizedName(i.product, locale) : '—'}`)
            .join('  ·  ')
          const addressLine = [order.delivery_address, order.delivery_zip, order.delivery_city]
            .filter(Boolean)
            .join(', ')
          const PayIcon = order.payment_method === 'card' ? CreditCard : Banknote

          return (
            <Card
              key={order.id}
              className={`overflow-hidden hover:shadow-md transition-shadow ${
                order.scheduled_for ? 'ring-2 ring-amber-300' : ''
              }`}
            >
              <CardContent className="p-0">
                <div className="flex">
                  {/* Status accent stripe */}
                  <div className={`w-1.5 shrink-0 ${statusAccent[order.status]}`} aria-hidden />

                  <div className="flex-1 min-w-0">
                    {/* Clickable header */}
                    <div className="p-4 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-lg">{order.order_number}</span>
                            <Badge className={`${statusColors[order.status]} flex items-center gap-1`}>
                              <StatusIcon className="h-3 w-3" />
                              {t.orders.status[order.status]}
                            </Badge>
                            {order.scheduled_for && (
                              <Badge className="bg-amber-100 text-amber-900 border-amber-300 flex items-center gap-1">
                                <CalendarClock className="h-3 w-3" />
                                {locale === 'hu' ? 'Időzítve' : 'Scheduled'}: {formatDate(order.scheduled_for)}
                              </Badge>
                            )}
                          </div>

                          {/* Customer · phone · time */}
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                            <span className="font-medium">{order.customer_name}</span>
                            <a
                              href={`tel:${order.customer_phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              {order.customer_phone}
                            </a>
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              {formatDate(order.created_at)}
                            </span>
                          </div>

                          {/* Delivery type + address */}
                          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                            {order.delivery_type === 'delivery' ? (
                              <>
                                <Truck className="h-4 w-4 shrink-0" />
                                <span className="truncate">
                                  {addressLine || (locale === 'hu' ? 'Kiszállítás' : 'Delivery')}
                                </span>
                              </>
                            ) : (
                              <>
                                <Store className="h-4 w-4 shrink-0" />
                                <span>{locale === 'hu' ? 'Személyes átvétel' : 'Pickup'}</span>
                              </>
                            )}
                          </div>

                          {/* What they ordered — at a glance */}
                          {itemSummary && (
                            <p className="mt-2 text-sm leading-relaxed line-clamp-2">{itemSummary}</p>
                          )}
                        </div>

                        {/* Total + meta */}
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-xl text-primary">{formatPrice(order.total)} Ft</p>
                          <p className="text-xs text-muted-foreground">
                            {order.items?.length || 0} {locale === 'hu' ? 'tétel' : 'items'}
                          </p>
                          <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <PayIcon className="h-3.5 w-3.5" />
                            {order.payment_method === 'card'
                              ? locale === 'hu' ? 'Kártya' : 'Card'
                              : locale === 'hu' ? 'Készpénz' : 'Cash'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    {nextStatus && (
                      <div className="border-t px-4 py-3 bg-muted/30 flex gap-2">
                        <Button
                          size="lg"
                          className="flex-1 h-12 text-base"
                          disabled={isUpdating}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStatusChange(order.id, nextStatus)
                          }}
                        >
                          <ArrowRight className="h-4 w-4 mr-2" />
                          {t.orders.status[nextStatus]}
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          className="h-12"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedOrder(order)
                          }}
                        >
                          {locale === 'hu' ? 'Részletek' : 'Details'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">{locale === 'hu' ? 'Nincs rendelés' : 'No orders'}</p>
          </div>
        )}
      </div>

      {/* Order Detail Modal - Mobile Optimized */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[90dvh] overflow-y-auto p-0 sm:p-6">
          {selectedOrder && (
            <>
              <DialogHeader className="p-4 sm:p-0 border-b sm:border-b-0">
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono">{selectedOrder.order_number}</span>
                  <Badge className={statusColors[selectedOrder.status]}>
                    {t.orders.status[selectedOrder.status]}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {formatDateLong(selectedOrder.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="p-4 sm:p-0 space-y-6">
                {/* Scheduled / estimated time */}
                {selectedOrder.scheduled_for ? (
                  <div className="flex items-center gap-3 rounded-lg border-2 border-amber-300 bg-amber-50 p-4">
                    <CalendarClock className="h-7 w-7 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">
                        {selectedOrder.delivery_type === 'delivery'
                          ? locale === 'hu' ? 'Időzített kiszállítás' : 'Scheduled delivery'
                          : locale === 'hu' ? 'Időzített átvétel' : 'Scheduled pickup'}
                      </p>
                      <p className="text-lg font-bold text-amber-900">
                        {formatDateLong(selectedOrder.scheduled_for)}
                      </p>
                    </div>
                  </div>
                ) : selectedOrder.delivery_time_min != null && selectedOrder.delivery_time_max != null ? (
                  <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{locale === 'hu' ? 'Becsült idő:' : 'Estimated time:'}</span>
                    <span className="font-semibold">
                      {selectedOrder.delivery_time_min}–{selectedOrder.delivery_time_max} {locale === 'hu' ? 'perc' : 'min'}
                    </span>
                  </div>
                ) : null}

                {/* Quick Status Buttons - Mobile Friendly */}
                <div className="space-y-3">
                  <p className="text-sm font-medium">{locale === 'hu' ? 'Státusz módosítása' : 'Change status'}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {statuses.filter(s => s !== 'cancelled').map((status) => {
                      const StatusIcon = statusIcons[status]
                      return (
                        <Button
                          key={status}
                          variant={selectedOrder.status === status ? 'default' : 'outline'}
                          size="lg"
                          className="h-auto py-3 flex flex-col gap-1"
                          disabled={isUpdating}
                          onClick={() => handleStatusChange(selectedOrder.id, status)}
                        >
                          <StatusIcon className="h-5 w-5" />
                          <span className="text-xs">{t.orders.status[status]}</span>
                        </Button>
                      )
                    })}
                  </div>
                  {selectedOrder.status !== 'cancelled' && (
                    <Button
                      variant="destructive"
                      size="lg"
                      className="w-full h-12"
                      disabled={isUpdating}
                      onClick={() => handleStatusChange(selectedOrder.id, 'cancelled')}
                    >
                      <X className="h-4 w-4 mr-2" />
                      {t.orders.status.cancelled}
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Customer Info - Touch Friendly */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <h4 className="font-semibold">{t.checkout.contactInfo}</h4>
                      <div className="space-y-2">
                        <p className="text-sm">{selectedOrder.customer_name}</p>
                        <a 
                          href={`tel:${selectedOrder.customer_phone}`}
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <Phone className="h-4 w-4" />
                          {selectedOrder.customer_phone}
                        </a>
                        {selectedOrder.customer_email && (
                          <p className="text-sm text-muted-foreground">{selectedOrder.customer_email}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {selectedOrder.delivery_type === 'delivery' && (
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <h4 className="font-semibold flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {t.checkout.deliveryAddress}
                        </h4>
                        <div className="text-sm">
                          <p>{selectedOrder.delivery_address}</p>
                          <p>{selectedOrder.delivery_zip} {selectedOrder.delivery_city}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <Separator />

                {/* Order Items */}
                <div>
                  <h4 className="font-semibold mb-3">
                    {locale === 'hu' ? 'Tételek' : 'Items'}
                  </h4>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-start p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <span className="font-medium">
                            {item.quantity}x{' '}
                            {item.product ? getLocalizedName(item.product, locale) : 'Unknown'}
                          </span>
                          {item.size && (
                            <span className="text-muted-foreground">
                              {' '}({getLocalizedName(item.size, locale)})
                            </span>
                          )}
                          {item.toppings && item.toppings.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              + {item.toppings.map((t) => t.topping?.name_hu || '').join(', ')}
                            </p>
                          )}
                        </div>
                        <span className="font-semibold text-lg">{formatPrice(item.total_price)} Ft</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Totals */}
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t.cart.subtotal}</span>
                      <span>{formatPrice(selectedOrder.subtotal)} Ft</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{t.cart.deliveryFee}</span>
                      <span>{formatPrice(selectedOrder.delivery_fee)} Ft</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-xl font-bold pt-2">
                      <span>{t.cart.total}</span>
                      <span className="text-primary">{formatPrice(selectedOrder.total)} Ft</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                {selectedOrder.notes && (
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">{t.checkout.notes}</h4>
                      <p className="text-sm">{selectedOrder.notes}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Timestamps */}
                <div className="text-xs text-muted-foreground space-y-1 pb-4">
                  <p>{locale === 'hu' ? 'Létrehozva' : 'Created'}: {formatDateLong(selectedOrder.created_at)}</p>
                  {selectedOrder.confirmed_at && (
                    <p>{locale === 'hu' ? 'Visszaigazolva' : 'Confirmed'}: {formatDateLong(selectedOrder.confirmed_at)}</p>
                  )}
                  {selectedOrder.completed_at && (
                    <p>{locale === 'hu' ? 'Teljesítve' : 'Completed'}: {formatDateLong(selectedOrder.completed_at)}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
