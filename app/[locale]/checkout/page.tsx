import { getDictionary } from '@/lib/i18n/get-dictionary'
import type { Locale } from '@/lib/i18n/config'
import { CheckoutForm } from '@/components/checkout-form'
import { createClient } from '@/lib/supabase/server'
import type { DeliveryZone } from '@/lib/types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  return {
    title: locale === 'hu' ? 'Rendelés véglegesítése' : 'Checkout',
  }
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dictionary = await getDictionary(locale)
  const supabase = await createClient()

  // Fetch delivery zones
  const { data: deliveryZonesData } = await supabase
    .from('delivery_zones')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const deliveryZones = (deliveryZonesData || []) as DeliveryZone[]

  return (
    <div className="py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="mb-8 text-center font-serif text-3xl font-bold md:text-4xl">
          {dictionary.checkout.title}
        </h1>
        
        <CheckoutForm locale={locale} dictionary={dictionary} deliveryZones={deliveryZones} />
      </div>
    </div>
  )
}
