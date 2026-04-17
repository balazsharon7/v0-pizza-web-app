import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Clock, MapPin, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import type { Locale } from '@/lib/i18n/config'
import { createClient } from '@/lib/supabase/server'
import { FeaturedPizzas } from '@/components/featured-pizzas'
import { OpenStatus } from '@/components/open-status'

// Disable caching to always show fresh data
export const dynamic = 'force-dynamic'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dictionary = await getDictionary(locale)
  const t = dictionary
  
  const supabase = await createClient()
  
  // Fetch featured pizzas (first 4)
  const { data: pizzas } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_available', true)
    .eq('is_customizable', true)
    .order('sort_order')
    .limit(4)

  // Fetch settings
  const { data: settingsData } = await supabase
    .from('settings')
    .select('key, value')

  const settings: Record<string, any> = {}
  settingsData?.forEach((s) => {
    settings[s.key] = s.value
  })

  const storeInfo = settings.store_info || {}
  const openingHours = settings.opening_hours || {}
  const delivery = settings.delivery || {}

  // Get today's opening hours
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const today = days[new Date().getDay()]
  const todayHours = openingHours[today]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[600px] lg:min-h-[700px] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pizza.png-rUKL61RQ8vj4HmsJXCeunknykWsExk.webp"
            alt="Fresh pizzas with Italian ingredients"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-20 md:py-28 lg:py-36 relative z-10">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm border border-primary/20">
              <OpenStatus locale={locale} compact />
            </div>
            
            <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="text-foreground">{t.hero.title}</span>
            </h1>
            
            <p className="text-xl text-muted-foreground md:text-2xl leading-relaxed">
              {t.hero.subtitle}
            </p>
            
            <p className="text-muted-foreground leading-relaxed max-w-lg">
              {t.hero.description}
            </p>
            
            <div className="flex flex-col gap-4 sm:flex-row pt-4">
              <Button asChild size="lg" className="gap-2 text-base h-12 px-8">
                <Link href={`/${locale}/menu`}>
                  {t.hero.cta}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base h-12 px-8 backdrop-blur-sm bg-background/50">
                <Link href={`/${locale}/about`}>
                  {locale === 'hu' ? 'Rólunk' : 'About Us'}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Info Bar */}
      <section className="border-y bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{locale === 'hu' ? 'Ma nyitva' : 'Open today'}</p>
                <p className="font-semibold">
                  {todayHours?.closed 
                    ? (locale === 'hu' ? 'Zárva' : 'Closed')
                    : `${todayHours?.open || '11:00'} - ${todayHours?.close || '22:00'}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{locale === 'hu' ? 'Rendelés' : 'Order'}</p>
                <a href={`tel:${storeInfo.phone || '+36 1 234 5678'}`} className="font-semibold hover:text-primary transition-colors">
                  {storeInfo.phone || '+36 1 234 5678'}
                </a>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{locale === 'hu' ? 'Címünk' : 'Address'}</p>
                <p className="font-semibold">{storeInfo.address || 'Budaörs'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <a href={`mailto:${storeInfo.email || 'info@terraverde.hu'}`} className="font-semibold hover:text-primary transition-colors">
                  {storeInfo.email || 'info@terraverde.hu'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Pizzas */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <span className="inline-block text-primary font-medium mb-2">
              {locale === 'hu' ? 'Frissen készítve' : 'Freshly Made'}
            </span>
            <h2 className="font-serif text-3xl font-bold md:text-4xl lg:text-5xl">
              {locale === 'hu' ? 'Népszerű pizzáink' : 'Popular Pizzas'}
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              {locale === 'hu' 
                ? 'Fedezd fel legkedveltebb pizzáinkat, amelyeket 48 órán át kelesztett tésztából és prémium olasz alapanyagokból készítünk'
                : 'Discover our most loved pizzas, made with 48-hour fermented dough and premium Italian ingredients'}
            </p>
          </div>
          
          <FeaturedPizzas pizzas={pizzas || []} locale={locale} dictionary={dictionary} />
          
          <div className="mt-12 text-center">
            <Button asChild size="lg" className="gap-2 text-base h-12 px-8">
              <Link href={`/${locale}/menu`}>
                {t.nav.viewMenu}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="border-t bg-muted/30 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <span className="inline-block text-primary font-medium mb-2">
              {locale === 'hu' ? 'Terra Verde' : 'Terra Verde'}
            </span>
            <h2 className="font-serif text-3xl font-bold md:text-4xl lg:text-5xl">
              {locale === 'hu' ? 'Miért minket válassz?' : 'Why Choose Us?'}
            </h2>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            <div className="text-center p-8 rounded-2xl bg-background border shadow-sm hover:shadow-md transition-shadow">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-4xl">
                🌿
              </div>
              <h3 className="mb-3 font-serif text-xl font-semibold">
                {locale === 'hu' ? 'Friss alapanyagok' : 'Fresh Ingredients'}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {locale === 'hu'
                  ? 'Minden nap friss, helyi termelőktől származó alapanyagokat használunk.'
                  : 'We use fresh, locally sourced ingredients every single day.'}
              </p>
            </div>
            
            <div className="text-center p-8 rounded-2xl bg-background border shadow-sm hover:shadow-md transition-shadow">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-4xl">
                👨‍🍳
              </div>
              <h3 className="mb-3 font-serif text-xl font-semibold">
                {locale === 'hu' ? 'Hagyományos receptek' : 'Traditional Recipes'}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {locale === 'hu'
                  ? 'Eredeti olasz receptek, generációkon át öröklődő tudással.'
                  : 'Authentic Italian recipes passed down through generations.'}
              </p>
            </div>
            
            <div className="text-center p-8 rounded-2xl bg-background border shadow-sm hover:shadow-md transition-shadow">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-4xl">
                🚀
              </div>
              <h3 className="mb-3 font-serif text-xl font-semibold">
                {locale === 'hu' ? 'Gyors kiszállítás' : 'Fast Delivery'}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {locale === 'hu'
                  ? `Rendelésed ${delivery.estimated_time_min || 30}-${delivery.estimated_time_max || 45} percen belül nálad van.`
                  : `Your order arrives in ${delivery.estimated_time_min || 30}-${delivery.estimated_time_max || 45} minutes.`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl font-bold md:text-4xl lg:text-5xl mb-4">
            {locale === 'hu' ? 'Éhes vagy?' : 'Feeling Hungry?'}
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            {locale === 'hu'
              ? 'Rendelj most és élvezd a frissen készült pizzák ízét!'
              : 'Order now and enjoy the taste of freshly made pizzas!'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="text-base h-12 px-8">
              <Link href={`/${locale}/menu`}>
                {t.hero.cta}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base h-12 px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <a href={`tel:${storeInfo.phone || '+36 1 234 5678'}`}>
                <Phone className="mr-2 h-5 w-5" />
                {storeInfo.phone || '+36 1 234 5678'}
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
