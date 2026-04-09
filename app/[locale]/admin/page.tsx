import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import type { Locale } from '@/lib/i18n/config'
import { formatPrice } from '@/lib/types'
import { ShoppingBag, DollarSign, Clock, CheckCircle } from 'lucide-react'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  return {
    title: locale === 'hu' ? 'Admin - Áttekintés' : 'Admin - Overview',
  }
}

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const supabase = await createClient()

  // Fetch statistics
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    { count: totalOrders },
    { count: todayOrders },
    { count: pendingOrders },
    { data: revenueData },
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['pending', 'confirmed', 'preparing']),
    supabase.from('orders').select('total').eq('status', 'completed'),
  ])

  const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total, 0) || 0

  // Fetch recent orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    {
      title: locale === 'hu' ? 'Összes rendelés' : 'Total Orders',
      value: totalOrders || 0,
      icon: ShoppingBag,
      color: 'text-blue-500',
    },
    {
      title: locale === 'hu' ? 'Mai rendelések' : 'Today Orders',
      value: todayOrders || 0,
      icon: Clock,
      color: 'text-green-500',
    },
    {
      title: locale === 'hu' ? 'Aktív rendelések' : 'Active Orders',
      value: pendingOrders || 0,
      icon: CheckCircle,
      color: 'text-orange-500',
    },
    {
      title: locale === 'hu' ? 'Összes bevétel' : 'Total Revenue',
      value: `${formatPrice(totalRevenue)} Ft`,
      icon: DollarSign,
      color: 'text-primary',
    },
  ]

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    preparing: 'bg-orange-100 text-orange-800',
    ready: 'bg-green-100 text-green-800',
    delivering: 'bg-purple-100 text-purple-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold md:text-3xl">
        {locale === 'hu' ? 'Admin Áttekintés' : 'Admin Overview'}
      </h1>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>{locale === 'hu' ? 'Legutóbbi rendelések' : 'Recent Orders'}</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders && recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-mono font-semibold">{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                        statusColors[order.status] || 'bg-gray-100'
                      }`}
                    >
                      {order.status}
                    </span>
                    <p className="mt-1 font-semibold">{formatPrice(order.total)} Ft</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              {locale === 'hu' ? 'Még nincs rendelés' : 'No orders yet'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
