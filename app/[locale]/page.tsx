import Link from 'next/link'
import { ArrowRight, Clock, MapPin, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import type { Locale } from '@/lib/i18n/config'
import { createClient } from '@/lib/supabase/server'
import { FeaturedPizzas } from '@/components/featured-pizzas'

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

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                  <span className="text-primary">{t.hero.title}</span>
                </h1>
                <p className="text-xl text-muted-foreground md:text-2xl">
                  {t.hero.subtitle}
                </p>
              </div>
              <p className="max-w-lg text-muted-foreground leading-relaxed">
                {t.hero.description}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="gap-2">
                  <Link href={`/${locale}/menu`}>
                    {t.hero.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href={`/${locale}/menu`}>
                    {t.hero.viewMenu}
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative aspect-square max-w-lg mx-auto lg:mx-0">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl" />
              <div className="relative flex items-center justify-center h-full">
                <div className="text-[12rem] md:text-[16rem] select-none">🍕</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -bottom-1 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Quick Info Bar */}
      <section className="border-y bg-card">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 py-6 sm:grid-cols-3">
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.footer.openingHours}</p>
                <p className="font-medium">11:00 - 22:00</p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.footer.contact}</p>
                <p className="font-medium">+36 1 234 5678</p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center sm:justify-end">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.footer.address}</p>
                <p className="font-medium">Budapest</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Pizzas */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="font-serif text-3xl font-bold md:text-4xl">
              {locale === 'hu' ? 'Népszerű pizzáink' : 'Popular Pizzas'}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {locale === 'hu' 
                ? 'Fedezd fel legkedveltebb pizzáinkat'
                : 'Discover our most loved pizzas'}
            </p>
          </div>
          
          <FeaturedPizzas pizzas={pizzas || []} locale={locale} dictionary={dictionary} />
          
          <div className="mt-10 text-center">
            <Button asChild variant="outline" size="lg">
              <Link href={`/${locale}/menu`}>
                {t.nav.viewMenu}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="border-t bg-muted/50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="font-serif text-3xl font-bold md:text-4xl">
              {locale === 'hu' ? 'Miért minket válassz?' : 'Why Choose Us?'}
            </h2>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
                🌿
              </div>
              <h3 className="mb-2 font-serif text-xl font-semibold">
                {locale === 'hu' ? 'Friss alapanyagok' : 'Fresh Ingredients'}
              </h3>
              <p className="text-muted-foreground">
                {locale === 'hu'
                  ? 'Minden nap friss, helyi termelőktől származó alapanyagokat használunk.'
                  : 'We use fresh, locally sourced ingredients every single day.'}
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
                👨‍🍳
              </div>
              <h3 className="mb-2 font-serif text-xl font-semibold">
                {locale === 'hu' ? 'Hagyományos receptek' : 'Traditional Recipes'}
              </h3>
              <p className="text-muted-foreground">
                {locale === 'hu'
                  ? 'Eredeti olasz receptek, generációkon át öröklődő tudással.'
                  : 'Authentic Italian recipes passed down through generations.'}
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
                🚀
              </div>
              <h3 className="mb-2 font-serif text-xl font-semibold">
                {locale === 'hu' ? 'Gyors kiszállítás' : 'Fast Delivery'}
              </h3>
              <p className="text-muted-foreground">
                {locale === 'hu'
                  ? 'Rendelésed 30-45 percen belül nálad van, melegen és frissen.'
                  : 'Your order arrives in 30-45 minutes, hot and fresh.'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
