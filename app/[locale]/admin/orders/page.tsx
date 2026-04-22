import { createClient } from '@/lib/supabase/server'
import type { Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { OrdersList } from '@/components/admin/orders-list'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  return {
    title: locale === 'hu' ? 'Admin - Rendelések' : 'Admin - Orders',
  }
}

export default async function AdminOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const { locale } = await params
  const { from, to } = await searchParams
  const dictionary = await getDictionary(locale)
  const supabase = await createClient()

  // Default to today if no date range specified
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const fromDate = from ? new Date(from) : today
  const toDate = to ? new Date(to) : tomorrow
  // Ensure toDate is end of day
  toDate.setHours(23, 59, 59, 999)

  let query = supabase
    .from('orders')
    .select(`
      *,
      items:order_items(
        *,
        product:products(*),
        size:sizes(*),
        toppings:order_item_toppings(
          *,
          topping:toppings(*)
        )
      )
    `)
    .gte('created_at', fromDate.toISOString())
    .lte('created_at', toDate.toISOString())
    .order('created_at', { ascending: false })

  const { data: orders } = await query

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold md:text-3xl">
        {locale === 'hu' ? 'Rendelések' : 'Orders'}
      </h1>

      <OrdersList 
        orders={orders || []} 
        locale={locale} 
        dictionary={dictionary}
        initialFromDate={fromDate.toISOString().split('T')[0]}
        initialToDate={(to ? toDate : today).toISOString().split('T')[0]}
      />
    </div>
  )
}
