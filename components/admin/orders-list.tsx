'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatPrice, getLocalizedName, type Order, type OrderStatus } from '@/lib/types'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/get-dictionary'
import { updateOrderStatus } from './actions'

interface OrdersListProps {
  orders: Order[]
  locale: Locale
  dictionary: Dictionary
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

const statuses: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'delivering',
  'completed',
  'cancelled',
]

export function OrdersList({ orders, locale, dictionary }: OrdersListProps) {
  const router = useRouter()
  const t = dictionary
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter((o) => o.status === filterStatus)

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const result = await updateOrderStatus(orderId, newStatus)
      if (result.success) {
        toast.success(locale === 'hu' ? 'Státusz frissítve' : 'Status updated')
        router.refresh()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error(locale === 'hu' ? 'Hiba történt' : 'Error occurred')
    }
  }

  const formatDate = (dateStr: string) => {
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
      {/* Filter */}
      <div className="flex gap-4 mb-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
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
      </div>

      {/* Orders Grid */}
      <div className="grid gap-4">
        {filteredOrders.map((order) => (
          <Card
            key={order.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedOrder(order)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">{order.order_number}</span>
                    <Badge className={statusColors[order.status]}>
                      {t.orders.status[order.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">{formatPrice(order.total)} Ft</p>
                  <p className="text-sm text-muted-foreground">
                    {order.delivery_type === 'delivery' ? '🚗 Delivery' : '🏪 Pickup'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredOrders.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            {locale === 'hu' ? 'Nincs rendelés' : 'No orders'}
          </p>
        )}
      </div>

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono">{selectedOrder.order_number}</span>
                  <Badge className={statusColors[selectedOrder.status]}>
                    {t.orders.status[selectedOrder.status]}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Status Update */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {locale === 'hu' ? 'Státusz:' : 'Status:'}
                  </span>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) => handleStatusChange(selectedOrder.id, value as OrderStatus)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {t.orders.status[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Customer Info */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-2">{t.checkout.contactInfo}</h4>
                    <p>{selectedOrder.customer_name}</p>
                    <p>{selectedOrder.customer_phone}</p>
                    {selectedOrder.customer_email && <p>{selectedOrder.customer_email}</p>}
                  </div>
                  {selectedOrder.delivery_type === 'delivery' && (
                    <div>
                      <h4 className="font-semibold mb-2">{t.checkout.deliveryAddress}</h4>
                      <p>{selectedOrder.delivery_address}</p>
                      <p>{selectedOrder.delivery_zip} {selectedOrder.delivery_city}</p>
                    </div>
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
                      <div key={item.id} className="flex justify-between text-sm">
                        <div>
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
                            <p className="text-xs text-muted-foreground">
                              + {item.toppings.map((t) => t.topping?.name_hu || '').join(', ')}
                            </p>
                          )}
                        </div>
                        <span className="font-medium">{formatPrice(item.total_price)} Ft</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t.cart.subtotal}</span>
                    <span>{formatPrice(selectedOrder.subtotal)} Ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.cart.deliveryFee}</span>
                    <span>{formatPrice(selectedOrder.delivery_fee)} Ft</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>{t.cart.total}</span>
                    <span className="text-primary">{formatPrice(selectedOrder.total)} Ft</span>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">{t.checkout.notes}</h4>
                      <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                    </div>
                  </>
                )}

                {/* Timestamps */}
                <div className="text-xs text-muted-foreground">
                  <p>{locale === 'hu' ? 'Létrehozva' : 'Created'}: {formatDate(selectedOrder.created_at)}</p>
                  {selectedOrder.confirmed_at && (
                    <p>{locale === 'hu' ? 'Visszaigazolva' : 'Confirmed'}: {formatDate(selectedOrder.confirmed_at)}</p>
                  )}
                  {selectedOrder.completed_at && (
                    <p>{locale === 'hu' ? 'Teljesítve' : 'Completed'}: {formatDate(selectedOrder.completed_at)}</p>
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
