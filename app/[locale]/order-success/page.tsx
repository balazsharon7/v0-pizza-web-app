import Link from 'next/link'
import { CheckCircle, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import type { Locale } from '@/lib/i18n/config'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  return {
    title: locale === 'hu' ? 'Sikeres rendelés' : 'Order Successful',
  }
}

export default async function OrderSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ order?: string }>
}) {
  const { locale } = await params
  const { order: orderNumber } = await searchParams
  const dictionary = await getDictionary(locale)
  const t = dictionary

  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-lg">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/20">
                <CheckCircle className="h-12 w-12 text-accent" />
              </div>
              
              <div className="space-y-2">
                <h1 className="font-serif text-2xl font-bold md:text-3xl">
                  {t.orderSuccess.title}
                </h1>
                <p className="text-muted-foreground">
                  {t.orderSuccess.thankYou}
                </p>
              </div>

              {orderNumber && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">{t.orderSuccess.orderNumber}</p>
                  <p className="text-xl font-bold font-mono">{orderNumber}</p>
                </div>
              )}

              <p className="text-muted-foreground">
                {t.orderSuccess.confirmation}
              </p>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                {orderNumber && (
                  <Button asChild size="lg" variant="default">
                    <Link href={`/${locale}/order-tracking?order=${orderNumber}`}>
                      <MapPin className="h-4 w-4 mr-2" />
                      {t.orderSuccess.trackOrder}
                    </Link>
                  </Button>
                )}
                <Button asChild size="lg" variant="outline">
                  <Link href={`/${locale}/menu`}>
                    {t.orderSuccess.backToMenu}
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
