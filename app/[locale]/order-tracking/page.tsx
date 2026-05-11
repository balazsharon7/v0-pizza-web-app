import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { OrderTracker } from '@/components/order-tracker'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, ArrowLeft } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Order } from '@/lib/types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  return {
    title: locale === 'hu' ? 'Rendelés követése' : 'Order Tracking',
  }
}

const translations = {
  hu: {
    title: 'Rendelés követése',
    subtitle: 'Add meg a rendelésszámot a követéshez',
    placeholder: 'pl. TV-123456',
    search: 'Keresés',
    notFound: 'Rendelés nem található',
    notFoundDesc: 'A megadott rendelésszámmal nem találtunk rendelést. Kérjük, ellenőrizd a számot.',
    backToMenu: 'Vissza a menühöz',
  },
  en: {
    title: 'Order Tracking',
    subtitle: 'Enter your order number to track',
    placeholder: 'e.g. TV-123456',
    search: 'Search',
    notFound: 'Order not found',
    notFoundDesc: 'We could not find an order with this number. Please check and try again.',
    backToMenu: 'Back to Menu',
  },
}

export default async function OrderTrackingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ order?: string }>
}) {
  const { locale } = await params
  const { order: orderNumber } = await searchParams
  const t = translations[locale]

  let order: Order | null = null

  if (orderNumber) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single()
    
    order = data as Order | null
  }

  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Back link */}
        <Link 
          href={`/${locale}/menu`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.backToMenu}
        </Link>

        <h1 className="font-serif text-3xl font-bold mb-2">{t.title}</h1>
        <p className="text-muted-foreground mb-8">{t.subtitle}</p>

        {/* Search Form */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <form action="" method="GET" className="flex gap-3">
              <Input
                name="order"
                placeholder={t.placeholder}
                defaultValue={orderNumber || ''}
                className="flex-1 font-mono"
              />
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                {t.search}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Order Tracker or Not Found */}
        {orderNumber && !order && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="font-serif text-xl font-semibold mb-2">{t.notFound}</h2>
                <p className="text-muted-foreground">{t.notFoundDesc}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {order && <OrderTracker initialOrder={order} locale={locale} />}
      </div>
    </div>
  )
}
