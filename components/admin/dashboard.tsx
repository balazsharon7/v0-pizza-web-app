'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Order, OrderStatus } from '@/lib/types'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/get-dictionary'
import { TrendingUp, Package, Clock, CheckCircle, Truck } from 'lucide-react'

interface AdminDashboardProps {
  orders: Order[]
  locale: Locale
  dictionary: Dictionary
}

const statusIcons: Record<OrderStatus, typeof Clock> = {
  pending: Clock,
  confirmed: CheckCircle,
  preparing: Package,
  ready: Package,
  delivering: Truck,
  completed: CheckCircle,
  cancelled: Clock,
}

export function AdminDashboard({ orders, locale, dictionary }: AdminDashboardProps) {
  const t = dictionary
  
  // Calculate statistics
  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  
  // Status breakdown
  const statusCounts = {
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    delivering: orders.filter(o => o.status === 'delivering').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }

  // Delivery types
  const deliveryStats = {
    pickup: orders.filter(o => o.delivery_type === 'pickup').length,
    delivery: orders.filter(o => o.delivery_type === 'delivery').length,
  }

  // Payment methods
  const paymentStats = {
    cash: orders.filter(o => o.payment_method === 'cash').length,
    card: orders.filter(o => o.payment_method === 'card').length,
  }

  // Active orders (pending, confirmed, preparing, ready, delivering)
  const activeOrders = orders.filter(o => 
    ['pending', 'confirmed', 'preparing', 'ready', 'delivering'].includes(o.status)
  ).length

  // Today's revenue
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todaysRevenue = orders
    .filter(o => new Date(o.created_at) >= today)
    .reduce((sum, order) => sum + order.total, 0)

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('hu-HU').format(price)
  }

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    subtitle,
    trend 
  }: { 
    title: string
    value: string | number
    icon: typeof TrendingUp
    subtitle?: string
    trend?: number
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trend !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className={`h-4 w-4 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`} />
                <span className={`text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
              </div>
            )}
          </div>
          <div className="ml-4 p-3 bg-primary/10 rounded-lg">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title={locale === 'hu' ? 'Összes rendelés' : 'Total Orders'}
          value={totalOrders}
          icon={Package}
        />
        <StatCard 
          title={locale === 'hu' ? 'Aktív rendelések' : 'Active Orders'}
          value={activeOrders}
          icon={Clock}
          subtitle={locale === 'hu' ? 'Feldolgozás alatt' : 'In progress'}
        />
        <StatCard 
          title={locale === 'hu' ? 'Napi bevétel' : "Today's Revenue"}
          value={`${formatPrice(todaysRevenue)} Ft`}
          icon={TrendingUp}
        />
        <StatCard 
          title={locale === 'hu' ? 'Átlag rendelés' : 'Avg Order Value'}
          value={`${formatPrice(averageOrderValue)} Ft`}
          icon={Package}
        />
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>{locale === 'hu' ? 'Rendelés státusz' : 'Order Status'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'completed', 'cancelled'].map((status) => {
              const count = statusCounts[status as OrderStatus]
              if (count === 0) return null
              
              const statusLabels: Record<OrderStatus, string> = {
                pending: locale === 'hu' ? 'Függőben' : 'Pending',
                confirmed: locale === 'hu' ? 'Visszaigazolt' : 'Confirmed',
                preparing: locale === 'hu' ? 'Készítés alatt' : 'Preparing',
                ready: locale === 'hu' ? 'Kész' : 'Ready',
                delivering: locale === 'hu' ? 'Szállítás alatt' : 'Delivering',
                completed: locale === 'hu' ? 'Teljesítve' : 'Completed',
                cancelled: locale === 'hu' ? 'Törölve' : 'Cancelled',
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

              const Icon = statusIcons[status as OrderStatus]

              return (
                <div key={status} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{statusLabels[status as OrderStatus]}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Delivery & Payment Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{locale === 'hu' ? 'Szállítás típusa' : 'Delivery Type'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="font-medium">{locale === 'hu' ? 'Személyes átvétel' : 'Pickup'}</span>
                <span className="text-2xl font-bold text-blue-600">{deliveryStats.pickup}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                <span className="font-medium">{locale === 'hu' ? 'Házhozszállítás' : 'Delivery'}</span>
                <span className="text-2xl font-bold text-purple-600">{deliveryStats.delivery}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{locale === 'hu' ? 'Fizetési mód' : 'Payment Method'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="font-medium">{locale === 'hu' ? 'Készpénz' : 'Cash'}</span>
                <span className="text-2xl font-bold text-green-600">{paymentStats.cash}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                <span className="font-medium">{locale === 'hu' ? 'Kártya' : 'Card'}</span>
                <span className="text-2xl font-bold text-cyan-600">{paymentStats.card}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Total Revenue Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-2">
              {locale === 'hu' ? 'Teljes bevétel' : 'Total Revenue'}
            </p>
            <p className="text-4xl font-bold text-primary">
              {formatPrice(totalRevenue)} Ft
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {locale === 'hu' ? 'Az összes rendelésből' : 'From all orders'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
