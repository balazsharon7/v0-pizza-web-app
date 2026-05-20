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
import { AuroraBg } from '@/components/animations/aurora-bg'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

const fallbackOpeningHours = {
  monday: { open: '11:00', close: '22:00' },
  tuesday: { open: '11:00', close: '22:00' },
  wednesday: { open: '11:00', close: '22:00' },
  thursday: { open: '11:00', close: '22:00' },
  friday: { open: '11:00', close: '23:00' },
  saturday: { open: '12:00', close: '23:00' },
  sunday: { open: '12:00', close: '21:00' },
} as const

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params
  const t = await getDictionary(locale)
  const supabase = await createClient()

  const { data: settingsData } = await supabase.from('settings').select('key, value')
  const { data: deliveryZonesData } = await supabase
    .from('delivery_zones')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const deliveryZones = (deliveryZonesData || []) as DeliveryZone[]

  const settings: Record<string, any> = {}
  settingsData?.forEach((s) => { settings[s.key] = s.value })

  const storeInfo = settings.store_info || {}
  const openingHours = Object.keys(settings.opening_hours || {}).length
    ? settings.opening_hours
    : fallbackOpeningHours

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

  return (
    <main className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20 lg:py-32 overflow-hidden">
        <AuroraBg className="opacity-65" intensity={1.1} />
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-20 right-20 w-40 h-40 rounded-full border-2 border-primary" />
          <div className="absolute bottom-20 left-20 w-60 h-60 rounded-full border-2 border-accent" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Text */}
            <div className="space-y-6">
              {/* Pizzeria logo */}
              <div className="animate-fade-in-up w-[clamp(100px,14vw,160px)] aspect-square relative">
                <Image src="/hero/logo-hero.png" alt="Terra Verde Pizzéria" fill className="object-contain" priority />
              </div>

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
                  <Link href={`/${locale}/menu`}>{t.about.orderCta}</Link>
                </Button>
              </div>
            </div>

            {/* Photos — main + inset */}
            <div className="relative animate-scale-in animation-delay-200 max-w-md mx-auto lg:mx-0 w-full">
              {/* Main photo */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-4 ring-primary/10 aspect-[4/3]">
                <Image
                  src="/images/pizzak.jpg"
                  alt="Terra Verde – Pizzáink"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* Inset oven photo */}
              <div className="absolute -bottom-5 -right-5 w-36 h-36 rounded-xl overflow-hidden shadow-xl ring-2 ring-background">
                <Image
                  src="/images/pizza-room.jpg"
                  alt="Terra Verde – Kemencénk"
                  fill
                  className="object-cover"
                />
              </div>

              {/* 48h badge */}
              <div className="absolute -top-4 -left-4 bg-primary text-primary-foreground rounded-full w-20 h-20 flex flex-col items-center justify-center text-center shadow-lg">
                <span className="font-serif font-bold text-xl leading-none">48h</span>
                <span className="text-[10px] leading-tight opacity-90 px-1">
                  {locale === 'hu' ? 'kelesztés' : 'ferment'}
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Decorative pizza boxes ── */}
      <section className="py-10 overflow-hidden bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center gap-6 md:gap-14">
            <div className="relative w-52 md:w-72 lg:w-80 aspect-[4/3] -rotate-2 drop-shadow-2xl shrink-0">
              <Image
                src="/images/pizza-box-1.png"
                alt=""
                fill
                className="object-contain"
                aria-hidden
              />
            </div>
            <div className="relative w-52 md:w-72 lg:w-80 aspect-[4/3] rotate-2 drop-shadow-2xl shrink-0">
              <Image
                src="/images/pizza-box-2.png"
                alt=""
                fill
                className="object-contain"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Photo Gallery ── */}
      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6">

            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg group">
              <Image
                src="/images/pizza-fold.jpg"
                alt="Pizza al Portafoglio – Terra Verde"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <p className="absolute bottom-4 left-5 text-white font-serif text-lg font-semibold drop-shadow">
                Pizza al Portafoglio
              </p>
            </div>

            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg group">
              <Image
                src="/images/pizzak.jpg"
                alt={locale === 'hu' ? 'Pizzáink – Terra Verde' : 'Our pizzas – Terra Verde'}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <p className="absolute bottom-4 left-5 text-white font-serif text-lg font-semibold drop-shadow">
                {locale === 'hu' ? 'Pizzáink' : 'Our pizzas'}
              </p>
            </div>

            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg group">
              <Image
                src="/images/terasz.jpg"
                alt={locale === 'hu' ? 'Teraszunk – Terra Verde' : 'Our terrace – Terra Verde'}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <p className="absolute bottom-4 left-5 text-white font-serif text-lg font-semibold drop-shadow">
                {locale === 'hu' ? 'Teraszunk' : 'Our terrace'}
              </p>
            </div>

            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg group">
              <Image
                src="/images/pizza-room.jpg"
                alt={locale === 'hu' ? 'Konyhánk – Terra Verde' : 'Our kitchen – Terra Verde'}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <p className="absolute bottom-4 left-5 text-white font-serif text-lg font-semibold drop-shadow">
                {locale === 'hu' ? 'Konyhánk' : 'Our kitchen'}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Story ── */}
      <section className="relative py-16 lg:py-24 bg-card overflow-hidden">
        {/* Wood-fired oven watercolor — ghosted right-side background art */}
        <div
          className="about-oven-bg absolute inset-0 flex items-center justify-end pointer-events-none select-none"
          aria-hidden
        >
          <div className="relative h-full aspect-[2/3]">
            <Image
              src="/hero/oven.png"
              alt=""
              fill
              sizes="50vw"
              className="object-contain"
              priority={false}
            />
          </div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6 section-divider pt-8">
            <h2 className="font-serif text-3xl md:text-4xl font-bold">{t.about.storyTitle}</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">{t.about.storyText1}</p>
            <p className="text-lg text-muted-foreground leading-relaxed">{t.about.storyText2}</p>
          </div>
        </div>
      </section>

      {/* ── Quality ── */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14 section-divider pt-8">
            <h2 className="font-serif text-3xl md:text-4xl font-bold">{t.about.qualityTitle}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Timer, title: t.about.quality1Title, text: t.about.quality1Text },
              { icon: Wheat, title: t.about.quality2Title, text: t.about.quality2Text },
              { icon: ChefHat, title: t.about.quality3Title, text: t.about.quality3Text },
            ].map(({ icon: Icon, title, text }) => (
              <Card key={title} className="group text-center border-0 shadow-md hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 bg-card rounded-2xl">
                <CardContent className="pt-10 pb-8 px-6 space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/15 to-primary/5 group-hover:from-primary/25 group-hover:to-primary/10 transition-colors duration-300 flex items-center justify-center">
                    <Icon className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold tracking-tight">{title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact & Hours ── */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">

            {/* Contact */}
            <div className="space-y-8">
              <h2 className="font-serif text-3xl md:text-4xl font-bold">{t.about.contactTitle}</h2>
              <div className="space-y-6">
                {[
                  {
                    icon: MapPin,
                    label: t.about.address,
                    value: storeInfo.address || '2040 Budaörs, Szabadság út 23-25.',
                    href: undefined as string | undefined,
                  },
                  {
                    icon: Phone,
                    label: t.about.phone,
                    value: storeInfo.phone || '+36 30 173 5918',
                    href: `tel:${storeInfo.phone || '+36301735918'}`,
                  },
                  {
                    icon: Mail,
                    label: t.about.email,
                    value: storeInfo.email || 'info@terraverdepizza.hu',
                    href: `mailto:${storeInfo.email || 'info@terraverdepizza.hu'}`,
                  },
                ].map(({ icon: Icon, label, value, href }) => (
                  <div key={label} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{label}</h3>
                      {href ? (
                        <a href={href} className="text-muted-foreground hover:text-primary transition-colors">
                          {value}
                        </a>
                      ) : (
                        <p className="text-muted-foreground">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
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
                      return (
                        <div
                          key={day}
                          className="flex justify-between items-center py-2 border-b border-border last:border-0"
                        >
                          <span className="font-medium">{t.days[day]}</span>
                          {isClosed ? (
                            <span className="text-destructive font-medium">
                              {t.common.closed.toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              {hours.open} – {hours.close}
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

      {/* ── Delivery Zones ── */}
      {deliveryZones.length > 0 && (
        <section className="py-16 lg:py-24 bg-muted/20">
          <div className="container mx-auto px-4">
            <DeliveryZonesStatic zones={deliveryZones} locale={locale} />
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="relative py-16 lg:py-24 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
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
            <Link href={`/${locale}/menu`}>{t.nav.viewMenu}</Link>
          </Button>
        </div>
      </section>

    </main>
  )
}
