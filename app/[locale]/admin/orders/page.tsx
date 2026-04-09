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
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dictionary = await getDictionary(locale)
  const supabase = await createClient()

  const { data: orders } = await supabase
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
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold md:text-3xl">
        {locale === 'hu' ? 'Rendelések' : 'Orders'}
      </h1>

      <OrdersList orders={orders || []} locale={locale} dictionary={dictionary} />
    </div>
  )
}
