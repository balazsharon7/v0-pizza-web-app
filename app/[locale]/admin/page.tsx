import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import type { Locale } from '@/lib/i18n/config'
import { formatPrice } from '@/lib/types'
import { ShoppingBag, DollarSign, Clock, CheckCircle, TrendingUp, Users, Truck, Store } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RealtimeDashboard } from '@/components/admin/realtime-dashboard'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  return {
    title: locale === 'hu' ? 'Admin - Napi áttekintés' : 'Admin - Daily Overview',
  }
}

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const supabase = await createClient()

  // Get today's date range
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Fetch today's statistics
  const [
    { count: todayOrdersCount },
    { data: todayOrdersData },
    { count: pendingOrders },
    { count: totalCustomers },
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString()),
    supabase
      .from('orders')
      .select('total, status, delivery_type')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString()),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'delivering'])
      .gte('created_at', today.toISOString()),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true }),
  ])

  // Calculate today's stats
  const todayRevenue = todayOrdersData?.reduce((sum, order) => sum + order.total, 0) || 0
  const todayCompleted = todayOrdersData?.filter(o => o.status === 'completed').length || 0
  const todayDeliveries = todayOrdersData?.filter(o => o.delivery_type === 'delivery').length || 0
  const todayPickups = todayOrdersData?.filter(o => o.delivery_type === 'pickup').length || 0
  const averageOrder = todayOrdersCount ? Math.round(todayRevenue / todayOrdersCount) : 0

  // Fetch today's orders for the list
  const { data: todaysOrders } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString())
    .order('created_at', { ascending: false })

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    preparing: 'bg-orange-100 text-orange-800',
    ready: 'bg-green-100 text-green-800',
    delivering: 'bg-purple-100 text-purple-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const statusLabels: Record<string, { hu: string; en: string }> = {
    pending: { hu: 'Függőben', en: 'Pending' },
    confirmed: { hu: 'Visszaigazolva', en: 'Confirmed' },
    preparing: { hu: 'Készül', en: 'Preparing' },
    ready: { hu: 'Kész', en: 'Ready' },
    delivering: { hu: 'Kiszállítás', en: 'Delivering' },
    completed: { hu: 'Teljesítve', en: 'Completed' },
    cancelled: { hu: 'Törölve', en: 'Cancelled' },
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString(locale === 'hu' ? 'hu-HU' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <RealtimeDashboard locale={locale}>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold md:text-3xl">
            {locale === 'hu' ? 'Mai nap áttekintése' : "Today's Overview"}
          </h1>
          <p className="text-muted-foreground">
            {today.toLocaleDateString(locale === 'hu' ? 'hu-HU' : 'en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/admin/orders`}>
            {locale === 'hu' ? 'Összes rendelés' : 'All Orders'}
          </Link>
        </Button>
      </div>

      {/* Today's Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {locale === 'hu' ? 'Mai rendelések' : "Today's Orders"}
            </CardTitle>
            <ShoppingBag className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{todayOrdersCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {pendingOrders || 0} {locale === 'hu' ? 'aktív' : 'active'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {locale === 'hu' ? 'Mai bevétel' : "Today's Revenue"}
            </CardTitle>
            <DollarSign className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatPrice(todayRevenue)} Ft</div>
            <p className="text-xs text-muted-foreground">
              {todayCompleted} {locale === 'hu' ? 'teljesítve' : 'completed'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {locale === 'hu' ? 'Átlagos kosár' : 'Avg. Order'}
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatPrice(averageOrder)} Ft</div>
            <p className="text-xs text-muted-foreground">
              {locale === 'hu' ? 'rendelésenként' : 'per order'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {locale === 'hu' ? 'Kiszállítás/Elvitel' : 'Delivery/Pickup'}
            </CardTitle>
            <Truck className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{todayDeliveries}</span>
              </div>
              <span className="text-muted-foreground">/</span>
              <div className="flex items-center gap-1">
                <Store className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{todayPickups}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Orders Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            {locale === 'hu' ? 'Aktív rendelések' : 'Active Orders'}
          </CardTitle>
          {pendingOrders ? (
            <Badge variant="destructive" className="animate-pulse">
              {pendingOrders} {locale === 'hu' ? 'aktív' : 'active'}
            </Badge>
          ) : null}
        </CardHeader>
        <CardContent>
          {todaysOrders && todaysOrders.filter(o => !['completed', 'cancelled'].includes(o.status)).length > 0 ? (
            <div className="space-y-3">
              {todaysOrders
                .filter(o => !['completed', 'cancelled'].includes(o.status))
                .map((order) => (
                  <Link
                    key={order.id}
                    href={`/${locale}/admin/orders`}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold">{order.order_number}</span>
                        <span className="text-sm text-muted-foreground">{order.customer_name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={statusColors[order.status]}>
                        {statusLabels[order.status]?.[locale] || order.status}
                      </Badge>
                      <div className="text-right">
                        <p className="font-bold">{formatPrice(order.total)} Ft</p>
                        <p className="text-xs text-muted-foreground">{formatTime(order.created_at)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium">
                {locale === 'hu' ? 'Nincs aktív rendelés' : 'No active orders'}
              </p>
              <p className="text-sm">
                {locale === 'hu' ? 'Minden rendben, pihenj!' : 'All clear, take a break!'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Completed Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            {locale === 'hu' ? 'Mai teljesített rendelések' : "Today's Completed Orders"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todaysOrders && todaysOrders.filter(o => o.status === 'completed').length > 0 ? (
            <div className="space-y-2">
              {todaysOrders
                .filter(o => o.status === 'completed')
                .map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border p-3 bg-green-50/50"
                  >
                    <div>
                      <span className="font-mono font-semibold">{order.order_number}</span>
                      <span className="text-sm text-muted-foreground ml-2">{order.customer_name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(order.total)} Ft</p>
                      <p className="text-xs text-muted-foreground">{formatTime(order.created_at)}</p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              {locale === 'hu' ? 'Még nincs teljesített rendelés ma' : 'No completed orders today yet'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
    </RealtimeDashboard>
  )
}
