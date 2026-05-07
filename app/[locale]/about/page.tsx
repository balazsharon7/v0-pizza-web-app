import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Phone, Mail, Clock, Timer, Wheat, ChefHat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import type { Locale } from '@/lib/i18n/config'
import { createClient } from '@/lib/supabase/server'
import { DeliveryZonesStatic } from '@/components/delivery-zones-map'
import type { DeliveryZone } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params
  const t = await getDictionary(locale)
  const supabase = await createClient()

  // Fetch settings
  const { data: settingsData } = await supabase
    .from('settings')
    .select('key, value')

  // Fetch delivery zones
  const { data: deliveryZonesData } = await supabase
    .from('delivery_zones')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const deliveryZones = (deliveryZonesData || []) as DeliveryZone[]

  const settings: Record<string, any> = {}
  settingsData?.forEach((s) => {
    settings[s.key] = s.value
  })

  const storeInfo = settings.store_info || {}
  const openingHours = settings.opening_hours || {}
  const delivery = settings.delivery || {}

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 right-20 w-40 h-40 rounded-full border-2 border-primary" />
          <div className="absolute bottom-20 left-20 w-60 h-60 rounded-full border-2 border-accent" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="animate-fade-in-up flex items-center gap-3">
                <div className="h-[2px] w-10 bg-accent rounded-full" />
                <span className="text-accent font-serif italic text-sm tracking-wide">
                  {locale === 'hu' ? 'Rólunk' : 'About Us'}
                </span>
              </div>
              <h1 className="animate-fade-in-up animation-delay-100 font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-balance">
                {t.about.heroTitle}
              </h1>
              <p className="animate-fade-in-up animation-delay-200 text-lg md:text-xl text-muted-foreground leading-relaxed">
                {t.about.heroDescription}
              </p>
              <div className="animate-fade-in-up animation-delay-300">
                <Button asChild size="lg" className="mt-4 shadow-lg shadow-primary/25 hover:shadow-xl transition-all">
                  <Link href={`/${locale}/menu`}>
                    {t.about.orderCta}
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative aspect-square max-w-md mx-auto lg:mx-0 animate-scale-in animation-delay-200">
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl" />
              <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl ring-4 ring-primary/10">
                <Image
                  src="/images/logo.webp"
                  alt="Terra Verde Pizzeria"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6 section-divider pt-8">
            <h2 className="font-serif text-3xl md:text-4xl font-bold">
              {t.about.storyTitle}
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t.about.storyText1}
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t.about.storyText2}
            </p>
          </div>
        </div>
      </section>

      {/* Quality Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14 section-divider pt-8">
            <h2 className="font-serif text-3xl md:text-4xl font-bold">
              {t.about.qualityTitle}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="group text-center border-0 shadow-md hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 bg-card rounded-2xl">
              <CardContent className="pt-10 pb-8 px-6 space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/15 to-primary/5 group-hover:from-primary/25 group-hover:to-primary/10 transition-colors duration-300 flex items-center justify-center">
                  <Timer className="w-10 h-10 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-semibold tracking-tight">
                  {t.about.quality1Title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t.about.quality1Text}
                </p>
              </CardContent>
            </Card>
            <Card className="group text-center border-0 shadow-md hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 bg-card rounded-2xl">
              <CardContent className="pt-10 pb-8 px-6 space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/15 to-primary/5 group-hover:from-primary/25 group-hover:to-primary/10 transition-colors duration-300 flex items-center justify-center">
                  <Wheat className="w-10 h-10 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-semibold tracking-tight">
                  {t.about.quality2Title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t.about.quality2Text}
                </p>
              </CardContent>
            </Card>
            <Card className="group text-center border-0 shadow-md hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 bg-card rounded-2xl">
              <CardContent className="pt-10 pb-8 px-6 space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/15 to-primary/5 group-hover:from-primary/25 group-hover:to-primary/10 transition-colors duration-300 flex items-center justify-center">
                  <ChefHat className="w-10 h-10 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-semibold tracking-tight">
                  {t.about.quality3Title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t.about.quality3Text}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact & Info Section */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              <h2 className="font-serif text-3xl md:text-4xl font-bold">
                {t.about.contactTitle}
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t.about.address}</h3>
                    <p className="text-muted-foreground">
                      {storeInfo.address || '2040 Budaors, Szabadsag ut 23-25.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t.about.phone}</h3>
                    <a 
                      href={`tel:${storeInfo.phone || '+36301735918'}`}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {storeInfo.phone || '+36 30 173 5918'}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t.about.email}</h3>
                    <a 
                      href={`mailto:${storeInfo.email || 'info@terraverdepizza.hu'}`}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {storeInfo.email || 'info@terraverdepizza.hu'}
                    </a>
                  </div>
                </div>
              </div>

              <Separator />

            </div>

            {/* Opening Hours */}
            <div className="space-y-8">
              <h2 className="font-serif text-3xl md:text-4xl font-bold flex items-center gap-3">
                <Clock className="w-8 h-8 text-primary" />
                {t.about.openingHoursTitle}
              </h2>
              
              <Card className="border-none shadow-lg">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {days.map((day) => {
                      const hours = openingHours[day]
                      const isClosed = !hours || hours.closed
                      const dayName = t.days[day]
                      
                      return (
                        <div 
                          key={day}
                          className="flex justify-between items-center py-2 border-b border-border last:border-0"
                        >
                          <span className="font-medium">{dayName}</span>
                          {isClosed ? (
                            <span className="text-destructive font-medium">
                              {t.common.closed.toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              {hours.open} - {hours.close}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </section>

      {/* Delivery Zones Section with Map */}
      {deliveryZones.length > 0 && (
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <DeliveryZonesStatic zones={deliveryZones} locale={locale} />
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="relative py-16 lg:py-24 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full border-2 border-primary-foreground/20" />
          <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full border-2 border-primary-foreground/20" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">
            {locale === 'hu' ? 'Kóstold meg az igazi olasz ízeket!' : 'Taste the real Italian flavors!'}
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            {locale === 'hu'
              ? 'Rendeld meg kedvenc pizzádat online, és mi házhoz visszük!'
              : 'Order your favorite pizza online and we will deliver it to your door!'}
          </p>
          <Button asChild size="lg" variant="secondary" className="shadow-lg hover:shadow-xl transition-all">
            <Link href={`/${locale}/menu`}>
              {t.nav.viewMenu}
            </Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
