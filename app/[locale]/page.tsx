import Link from 'next/link'
import { ArrowRight, Clock, MapPin, Phone, Mail, Leaf, ChefHat, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import type { Locale } from '@/lib/i18n/config'
import { createClient } from '@/lib/supabase/server'
import { FeaturedPizzas } from '@/components/featured-pizzas'
import { OpenStatus } from '@/components/open-status'
import { AuroraBg } from '@/components/animations/aurora-bg'
import { ScrollReveal } from '@/components/animations/scroll-reveal'
import { Marquee } from '@/components/animations/marquee'
import { WaveDivider } from '@/components/animations/wave-divider'
import { HeroCarousel, type HeroSlide } from '@/components/hero-carousel'

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

  // Fetch every pizza name for the scrolling marquee strip
  const { data: allPizzas } = await supabase
    .from('products')
    .select('name_hu, name_en')
    .eq('is_available', true)
    .eq('is_customizable', true)
    .order('sort_order')

  const pizzaNames = (allPizzas ?? [])
    .map((p) => (locale === 'hu' ? p.name_hu : p.name_en))
    .filter((n): n is string => !!n && n.trim().length > 0)

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

  // Hero showcase: two round pizzas that spin around their center.
  // To use your own photos, drop them into public/hero/ as pizza-1.jpg + pizza-2.jpg
  // — the paths below will pick them up automatically (Unsplash placeholders shown otherwise).
  const heroSlides: HeroSlide[] = [
    {
      src: '/hero/pizza-1.png',
      alt: 'Pizza prosciutto e basilico',
      label: 'Prosciutto e Basilico',
    },
    {
      src: '/hero/pizza-2.png',
      alt: 'Pizza margherita',
      label: 'Margherita',
    },
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/40">
        {/* Soft aurora glow behind everything, very subtle */}
        <AuroraBg className="opacity-40 mix-blend-multiply" intensity={0.7} />

        {/* Content */}
        <div className="container mx-auto px-4 py-16 md:py-24 lg:py-28 relative z-10">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-10 lg:gap-14 items-center">
            <div className="space-y-6 order-2 lg:order-1">
              <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary border border-primary/20">
                <OpenStatus locale={locale} compact />
              </div>

              <h1 className="animate-fade-in-up animation-delay-100 font-serif text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                <span className="text-foreground">Terra Verde</span>
                <span className="block text-primary mt-1">Pizzeria</span>
              </h1>

              <div className="animate-fade-in-up animation-delay-200 flex items-center gap-3">
                <div className="h-[2px] w-12 bg-accent rounded-full" />
                <span className="text-accent font-serif italic text-sm tracking-wide">
                  {locale === 'hu' ? 'Autentikus olasz ízek' : 'Authentic Italian flavors'}
                </span>
                <div className="h-[2px] w-12 bg-accent rounded-full" />
              </div>

              <p className="animate-fade-in-up animation-delay-300 text-xl text-muted-foreground md:text-2xl leading-relaxed">
                {t.hero.subtitle}
              </p>

              <p className="animate-fade-in-up animation-delay-400 text-muted-foreground leading-relaxed max-w-lg">
                {t.hero.description}
              </p>

              <div className="animate-fade-in-up animation-delay-500 flex flex-col gap-4 sm:flex-row pt-4">
                <Button asChild size="lg" className="gap-2 text-base h-12 px-8 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                  <Link href={`/${locale}/menu`}>
                    {t.hero.cta}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base h-12 px-8 hover:bg-muted/70 transition-all">
                  <Link href={`/${locale}/about`}>
                    {locale === 'hu' ? 'Rólunk' : 'About Us'}
                  </Link>
                </Button>
              </div>
            </div>

            {/* Round pizza showcase — each pizza spins around its center, crossfades to the next */}
            <div className="order-1 lg:order-2 animate-fade-in animation-delay-200 pb-8">
              <HeroCarousel
                slides={heroSlides}
                intervalMs={5000}
                spinSeconds={50}
                className="max-w-[480px] mx-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Marquee accent strip — full pizza lineup scrolling sideways */}
      <section className="bg-gradient-drift text-primary-foreground overflow-hidden">
        <Marquee
          speed={Math.max(28, pizzaNames.length * 4)}
          items={
            pizzaNames.length > 0
              ? pizzaNames
              : [
                  'Margherita',
                  'Prosciutto e Basilico',
                  'Diavola',
                  'Quattro Formaggi',
                  'Capricciosa',
                  'Funghi',
                ]
          }
        />
      </section>

      {/* Quick Info Bar */}
      <section className="border-y bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
            <ScrollReveal delay={0} className="flex items-center gap-4 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
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
            </ScrollReveal>

            <ScrollReveal delay={80} className="flex items-center gap-4 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{locale === 'hu' ? 'Rendelés' : 'Order'}</p>
                <a href={`tel:${storeInfo.phone || '+36 1 234 5678'}`} className="font-semibold hover:text-primary transition-colors">
                  {storeInfo.phone || '+36 1 234 5678'}
                </a>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={160} className="flex items-center gap-4 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{locale === 'hu' ? 'Címünk' : 'Address'}</p>
                <p className="font-semibold">{storeInfo.address || 'Budaörs'}</p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={240} className="flex items-center gap-4 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <a href={`mailto:${storeInfo.email || 'info@terraverde.hu'}`} className="font-semibold hover:text-primary transition-colors">
                  {storeInfo.email || 'info@terraverde.hu'}
                </a>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Featured Pizzas */}
      <section className="relative py-20 md:py-28">
        <div className="container mx-auto px-4 relative">
          <ScrollReveal className="mb-14 text-center pt-8">
            <span className="inline-block text-accent font-serif italic text-sm tracking-wide mb-3">
              {locale === 'hu' ? 'Frissen készítve' : 'Freshly Made'}
            </span>
            <h2 className="heading-underline font-serif text-3xl font-bold md:text-4xl lg:text-5xl">
              {locale === 'hu' ? 'Népszerű pizzáink' : 'Popular Pizzas'}
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {locale === 'hu'
                ? 'Fedezd fel legkedveltebb pizzáinkat, amelyeket 48 órán át kelesztett tésztából és prémium olasz alapanyagokból készítünk'
                : 'Discover our most loved pizzas, made with 48-hour fermented dough and premium Italian ingredients'}
            </p>
          </ScrollReveal>
          
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
      <section className="relative border-t bg-muted/30 py-20 md:py-28 overflow-hidden">
        <WaveDivider color="var(--background)" />
        <div className="container mx-auto px-4 relative">
          <ScrollReveal className="mb-14 text-center pt-8">
            <span className="inline-block text-accent font-serif italic text-sm tracking-wide mb-3">
              {locale === 'hu' ? 'Terra Verde' : 'Terra Verde'}
            </span>
            <h2 className="heading-underline font-serif text-3xl font-bold md:text-4xl lg:text-5xl">
              {locale === 'hu' ? 'Miért minket válassz?' : 'Why Choose Us?'}
            </h2>
          </ScrollReveal>

          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            <ScrollReveal delay={0} className="group text-center p-8 rounded-2xl bg-background border shadow-sm hover:shadow-xl hover:-translate-y-2 hover:rotate-[-0.5deg] transition-all duration-500">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 group-hover:from-primary/25 group-hover:to-primary/10 transition-all duration-500 group-hover:rotate-[12deg] group-hover:scale-110">
                <Leaf className="h-10 w-10 text-primary transition-transform duration-500 group-hover:-rotate-12" />
              </div>
              <h3 className="mb-3 font-serif text-xl font-semibold transition-colors group-hover:text-primary">
                {locale === 'hu' ? 'Friss alapanyagok' : 'Fresh Ingredients'}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {locale === 'hu'
                  ? 'Minden nap friss, helyi termelőktől származó alapanyagokat használunk.'
                  : 'We use fresh, locally sourced ingredients every single day.'}
              </p>
            </ScrollReveal>

            <ScrollReveal delay={120} className="group text-center p-8 rounded-2xl bg-background border shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 group-hover:from-primary/25 group-hover:to-primary/10 transition-all duration-500 group-hover:rotate-[12deg] group-hover:scale-110">
                <ChefHat className="h-10 w-10 text-primary transition-transform duration-500 group-hover:-rotate-12" />
              </div>
              <h3 className="mb-3 font-serif text-xl font-semibold transition-colors group-hover:text-primary">
                {locale === 'hu' ? 'Hagyományos receptek' : 'Traditional Recipes'}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {locale === 'hu'
                  ? 'Eredeti olasz receptek, generációkon át öröklődő tudással.'
                  : 'Authentic Italian recipes passed down through generations.'}
              </p>
            </ScrollReveal>

            <ScrollReveal delay={240} className="group text-center p-8 rounded-2xl bg-background border shadow-sm hover:shadow-xl hover:-translate-y-2 hover:rotate-[0.5deg] transition-all duration-500">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 group-hover:from-primary/25 group-hover:to-primary/10 transition-all duration-500 group-hover:rotate-[12deg] group-hover:scale-110">
                <Truck className="h-10 w-10 text-primary transition-transform duration-500 group-hover:translate-x-1" />
              </div>
              <h3 className="mb-3 font-serif text-xl font-semibold transition-colors group-hover:text-primary">
                {locale === 'hu' ? 'Gyors kiszállítás' : 'Fast Delivery'}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {locale === 'hu'
                  ? 'Rendelésed 1 órán belül nálad van.'
                  : 'Your order arrives in under 1 hour.'}
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 md:py-28 bg-gradient-drift text-primary-foreground overflow-hidden">
        <WaveDivider color="var(--muted)" flip={false} />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full border-2 border-primary-foreground/30 animate-[spin-slow_28s_linear_infinite]" />
          <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full border-2 border-primary-foreground/30 animate-[spin-slow_42s_linear_infinite_reverse]" />
          <div className="absolute top-1/2 left-1/3 w-20 h-20 rounded-full border border-primary-foreground/25 animate-[float-orbit_9s_ease-in-out_infinite]" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <ScrollReveal>
            <h2 className="font-serif text-3xl font-bold md:text-4xl lg:text-5xl mb-4">
              {locale === 'hu' ? 'Éhes vagy?' : 'Feeling Hungry?'}
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
              {locale === 'hu'
                ? 'Rendelj most és élvezd a frissen készült pizzák ízét!'
                : 'Order now and enjoy the taste of freshly made pizzas!'}
            </p>
          </ScrollReveal>
          <ScrollReveal delay={150} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="cta-glow text-base h-12 px-8 shadow-lg hover:shadow-xl transition-all">
              <Link href={`/${locale}/menu`}>
                {t.hero.cta}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="text-base h-12 px-8 shadow-lg hover:shadow-xl transition-all">
              <a href={`tel:${storeInfo.phone || '+36 1 234 5678'}`}>
                <Phone className="mr-2 h-5 w-5" />
                <span className="font-semibold">{storeInfo.phone || '+36 1 234 5678'}</span>
              </a>
            </Button>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
