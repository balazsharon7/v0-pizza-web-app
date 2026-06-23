import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import type { Locale } from '@/lib/i18n/config'
import { formatPrice, type Order, type OrderStatus } from '@/lib/types'
import {
  ShoppingBag,
  DollarSign,
  Clock,
  CheckCircle,
  TrendingUp,
  Truck,
  Store,
  CalendarClock,
  Banknote,
  CreditCard,
  Flame,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RealtimeDashboard } from '@/components/admin/realtime-dashboard'

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  return { title: locale === 'hu' ? 'Admin - Napi áttekintés' : 'Admin - Daily Overview' }
}

const TZ = 'Europe/Budapest'

const statusMeta: Record<OrderStatus, { hu: string; en: string; badge: string; accent: string }> = {
  pending: { hu: 'Függőben', en: 'Pending', badge: 'bg-yellow-100 text-yellow-800 border-yellow-200', accent: 'bg-yellow-400' },
  confirmed: { hu: 'Visszaigazolva', en: 'Confirmed', badge: 'bg-blue-100 text-blue-800 border-blue-200', accent: 'bg-blue-400' },
  preparing: { hu: 'Készül', en: 'Preparing', badge: 'bg-orange-100 text-orange-800 border-orange-200', accent: 'bg-orange-400' },
  ready: { hu: 'Kész', en: 'Ready', badge: 'bg-green-100 text-green-800 border-green-200', accent: 'bg-green-500' },
  delivering: { hu: 'Kiszállítás', en: 'Delivering', badge: 'bg-purple-100 text-purple-800 border-purple-200', accent: 'bg-purple-400' },
  completed: { hu: 'Teljesítve', en: 'Completed', badge: 'bg-gray-100 text-gray-800 border-gray-200', accent: 'bg-gray-300' },
  cancelled: { hu: 'Törölve', en: 'Cancelled', badge: 'bg-red-100 text-red-800 border-red-200', accent: 'bg-red-400' },
}

type OrderWithItems = Order & {
  items?: { quantity: number; product?: { name_hu: string; name_en: string } | null }[]
}

export default async function AdminDashboardPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  const isHu = locale === 'hu'
  const supabase = await createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [{ data: ordersData }, { data: scheduledData }] = await Promise.all([
    supabase
      .from('orders')
      .select('*, items:order_items(quantity, product:products(name_hu, name_en))')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .order('created_at', { ascending: false }),
    supabase
      .from('orders')
      .select('id, order_number, customer_name, delivery_type, total, status, scheduled_for')
      .gte('scheduled_for', today.toISOString())
      .lt('scheduled_for', tomorrow.toISOString())
      .not('status', 'in', '(completed,cancelled)')
      .order('scheduled_for', { ascending: true }),
  ])

  const orders = (ordersData ?? []) as OrderWithItems[]
  const scheduledToday = (scheduledData ?? []) as Order[]

  const ACTIVE: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'delivering']
  const nonCancelled = orders.filter((o) => o.status !== 'cancelled')
  const completed = orders.filter((o) => o.status === 'completed')
  const active = orders.filter((o) => ACTIVE.includes(o.status))
  const revenue = nonCancelled.reduce((s, o) => s + o.total, 0)
  const avgOrder = nonCancelled.length ? Math.round(revenue / nonCancelled.length) : 0
  const deliveries = orders.filter((o) => o.delivery_type === 'delivery').length
  const pickups = orders.filter((o) => o.delivery_type === 'pickup').length
  const cash = orders.filter((o) => o.payment_method === 'cash').length
  const card = orders.filter((o) => o.payment_method === 'card').length
  const completedPct = orders.length ? Math.round((completed.length / orders.length) * 100) : 0

  const pipeline = ACTIVE.map((status) => ({ status, count: orders.filter((o) => o.status === status).length }))

  // Top products today
  const prodMap = new Map<string, number>()
  for (const o of orders) {
    for (const it of o.items ?? []) {
      const name = it.product ? (isHu ? it.product.name_hu : it.product.name_en) : null
      if (!name) continue
      prodMap.set(name, (prodMap.get(name) ?? 0) + (it.quantity ?? 0))
    }
  }
  const topProducts = [...prodMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  const topMax = topProducts.length ? topProducts[0][1] : 1

  // Orders per hour (Budapest time), business window 10:00–23:00
  const hourOf = (s: string) =>
    Number(new Date(s).toLocaleString('en-GB', { timeZone: TZ, hour: '2-digit', hour12: false }))
  const START_H = 10
  const END_H = 23
  const hourly = Array.from({ length: END_H - START_H + 1 }, (_, i) => {
    const h = START_H + i
    return { h, count: orders.filter((o) => hourOf(o.created_at) === h).length }
  })
  const hourMax = Math.max(1, ...hourly.map((x) => x.count))

  const fmtTime = (s: string) =>
    new Date(s).toLocaleTimeString(isHu ? 'hu-HU' : 'en-US', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })

  const kpis = [
    {
      label: isHu ? 'Mai rendelések' : "Today's orders",
      value: String(orders.length),
      sub: `${active.length} ${isHu ? 'aktív' : 'active'}`,
      icon: ShoppingBag,
      tint: 'text-blue-600 bg-blue-100',
    },
    {
      label: isHu ? 'Mai bevétel' : "Today's revenue",
      value: `${formatPrice(revenue)} Ft`,
      sub: `${completed.length} ${isHu ? 'teljesítve' : 'completed'}`,
      icon: DollarSign,
      tint: 'text-green-600 bg-green-100',
    },
    {
      label: isHu ? 'Átlagos kosár' : 'Avg. order',
      value: `${formatPrice(avgOrder)} Ft`,
      sub: isHu ? 'rendelésenként' : 'per order',
      icon: TrendingUp,
      tint: 'text-orange-600 bg-orange-100',
    },
    {
      label: isHu ? 'Teljesített' : 'Completed',
      value: String(completed.length),
      sub: `${completedPct}% ${isHu ? 'a maiból' : 'of today'}`,
      icon: CheckCircle,
      tint: 'text-purple-600 bg-purple-100',
    },
  ]

  return (
    <RealtimeDashboard locale={locale}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold md:text-3xl">
              {isHu ? 'Mai nap áttekintése' : "Today's Overview"}
            </h1>
            <p className="text-muted-foreground capitalize">
              {today.toLocaleDateString(isHu ? 'hu-HU' : 'en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <Button asChild>
            <Link href={`/${locale}/admin/orders`}>
              {isHu ? 'Összes rendelés' : 'All orders'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => {
            const Icon = k.icon
            return (
              <Card key={k.label}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-muted-foreground">{k.label}</p>
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${k.tint}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="mt-3 text-3xl font-bold tracking-tight">{k.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{k.sub}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Kitchen pipeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame className="h-5 w-5 text-orange-500" />
              {isHu ? 'Konyhai munkasor' : 'Kitchen pipeline'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {pipeline.map(({ status, count }) => (
                <div key={status} className="rounded-lg border bg-muted/20 p-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${statusMeta[status].accent}`} />
                    <span className="text-xs text-muted-foreground">{isHu ? statusMeta[status].hu : statusMeta[status].en}</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold">{count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Scheduled for today */}
        {scheduledToday.length > 0 && (
          <Card className="border-amber-300 bg-amber-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-amber-900">
                <CalendarClock className="h-5 w-5 text-amber-600" />
                {isHu ? 'Mai időzített rendelések' : 'Scheduled for today'}
                <Badge className="bg-amber-100 text-amber-900 border-amber-300">{scheduledToday.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {scheduledToday.map((o) => (
                  <Link
                    key={o.id}
                    href={`/${locale}/admin/orders`}
                    className="flex items-center justify-between rounded-lg border border-amber-200 bg-background p-3 hover:bg-amber-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex flex-col items-center justify-center rounded-md bg-amber-100 px-2.5 py-1 text-amber-900">
                        <span className="text-sm font-bold leading-none">{o.scheduled_for ? fmtTime(o.scheduled_for) : ''}</span>
                      </span>
                      <div className="min-w-0">
                        <p className="font-mono font-semibold truncate">{o.order_number}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {o.customer_name} ·{' '}
                          {o.delivery_type === 'delivery' ? (isHu ? 'Kiszállítás' : 'Delivery') : (isHu ? 'Elvitel' : 'Pickup')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={statusMeta[o.status].badge}>{isHu ? statusMeta[o.status].hu : statusMeta[o.status].en}</Badge>
                      <span className="font-semibold">{formatPrice(o.total)} Ft</span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-orange-500" />
              {isHu ? 'Aktív rendelések' : 'Active orders'}
            </CardTitle>
            {active.length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {active.length} {isHu ? 'aktív' : 'active'}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {active.length > 0 ? (
              <div className="space-y-2">
                {active.map((order) => {
                  const summary = (order.items ?? [])
                    .map((i) => `${i.quantity}× ${i.product ? (isHu ? i.product.name_hu : i.product.name_en) : '—'}`)
                    .join('  ·  ')
                  return (
                    <Link
                      key={order.id}
                      href={`/${locale}/admin/orders`}
                      className="flex items-stretch gap-3 rounded-lg border overflow-hidden hover:bg-muted/40 transition-colors"
                    >
                      <span className={`w-1.5 shrink-0 ${statusMeta[order.status].accent}`} />
                      <div className="flex flex-1 items-center justify-between gap-3 p-3 min-w-0">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold">{order.order_number}</span>
                            <Badge className={statusMeta[order.status].badge}>{isHu ? statusMeta[order.status].hu : statusMeta[order.status].en}</Badge>
                            {order.scheduled_for && (
                              <Badge className="bg-amber-100 text-amber-900 border-amber-300 flex items-center gap-1">
                                <CalendarClock className="h-3 w-3" />
                                {fmtTime(order.scheduled_for)}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {order.customer_name} · {fmtTime(order.created_at)}
                          </p>
                          {summary && <p className="text-sm mt-1 truncate">{summary}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold">{formatPrice(order.total)} Ft</p>
                          <p className="text-xs text-muted-foreground inline-flex items-center gap-1 justify-end">
                            {order.delivery_type === 'delivery' ? <Truck className="h-3 w-3" /> : <Store className="h-3 w-3" />}
                            {order.delivery_type === 'delivery' ? (isHu ? 'Kiszáll.' : 'Deliv.') : (isHu ? 'Elvitel' : 'Pickup')}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="text-lg font-medium">{isHu ? 'Nincs aktív rendelés' : 'No active orders'}</p>
                <p className="text-sm">{isHu ? 'Minden rendben, pihenj!' : 'All clear, take a break!'}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top products + hourly */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{isHu ? 'Mai TOP termékek' : "Today's top products"}</CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length > 0 ? (
                <div className="space-y-3">
                  {topProducts.map(([name, qty], i) => (
                    <div key={name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate">
                          <span className="text-muted-foreground mr-1.5">{i + 1}.</span>
                          {name}
                        </span>
                        <span className="font-semibold shrink-0 ml-2">
                          {qty} {isHu ? 'db' : 'pcs'}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((qty / topMax) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-6">{isHu ? 'Még nincs adat ma' : 'No data yet today'}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{isHu ? 'Rendelések óránként' : 'Orders by hour'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-1 h-32">
                {hourly.map(({ h, count }) => (
                  <div key={h} className="flex flex-1 flex-col items-center gap-1 group" title={`${h}:00 — ${count}`}>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{count > 0 ? count : ''}</span>
                    <div
                      className={`w-full rounded-t ${count > 0 ? 'bg-primary/80 group-hover:bg-primary' : 'bg-muted'}`}
                      style={{ height: `${Math.max(4, Math.round((count / hourMax) * 96))}px` }}
                    />
                    <span className="text-[10px] text-muted-foreground tabular-nums">{h}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Breakdown + completed */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{isHu ? 'Megoszlás' : 'Breakdown'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3 flex items-center gap-3">
                  <Truck className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">{isHu ? 'Kiszállítás' : 'Delivery'}</p>
                    <p className="text-xl font-bold">{deliveries}</p>
                  </div>
                </div>
                <div className="rounded-lg border p-3 flex items-center gap-3">
                  <Store className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">{isHu ? 'Elvitel' : 'Pickup'}</p>
                    <p className="text-xl font-bold">{pickups}</p>
                  </div>
                </div>
                <div className="rounded-lg border p-3 flex items-center gap-3">
                  <Banknote className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">{isHu ? 'Készpénz' : 'Cash'}</p>
                    <p className="text-xl font-bold">{cash}</p>
                  </div>
                </div>
                <div className="rounded-lg border p-3 flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-cyan-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">{isHu ? 'Kártya' : 'Card'}</p>
                    <p className="text-xl font-bold">{card}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="h-5 w-5 text-green-500" />
                {isHu ? 'Mai teljesített' : 'Completed today'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {completed.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {completed.map((order) => (
                    <div key={order.id} className="flex items-center justify-between rounded-lg border p-3 bg-green-50/40">
                      <div className="min-w-0">
                        <span className="font-mono font-semibold">{order.order_number}</span>
                        <span className="text-sm text-muted-foreground ml-2">{order.customer_name}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold">{formatPrice(order.total)} Ft</p>
                        <p className="text-xs text-muted-foreground">{fmtTime(order.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-6 text-sm">
                  {isHu ? 'Még nincs teljesített rendelés ma' : 'No completed orders today yet'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </RealtimeDashboard>
  )
}
