import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Clock, MapPin, Phone, Mail, Leaf, ChefHat, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import type { Locale } from '@/lib/i18n/config'
import { createClient } from '@/lib/supabase/server'
import { FeaturedPizzas } from '@/components/featured-pizzas'
import { DeliveryZonesMapOnly } from '@/components/delivery-zones-map'
import type { DeliveryZone } from '@/lib/types'
import { ScrollReveal } from '@/components/animations/scroll-reveal'
import { Marquee } from '@/components/animations/marquee'
import { HeroCarousel, type HeroSlide } from '@/components/hero-carousel'
import { HeroSign } from '@/components/hero-sign'

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
  
  // Featured pizzas = the actual most-ordered ones. The product_order_counts()
  // SECURITY DEFINER RPC aggregates order_items across the whole table while
  // bypassing per-user RLS (it only returns counts, no PII). Ties get a
  // Fisher–Yates shuffle within the tied group, so a brand-new shop with
  // zero orders shows a random rotation and two equally popular pizzas
  // don't always render in the same order.
  const [productsResult, countsResult] = await Promise.all([
    supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_available', true)
      .eq('is_customizable', true),
    supabase.rpc('product_order_counts'),
  ])

  const orderCounts: Record<string, number> = {}
  ;(countsResult.data ?? []).forEach((row: { product_id: string; total_quantity: number | string }) => {
    if (!row?.product_id) return
    orderCounts[row.product_id] = Number(row.total_quantity ?? 0)
  })

  const availableProducts = productsResult.data ?? []
  // Group products by their order count, shuffle within each group with
  // Fisher–Yates, then flatten from highest count to lowest.
  const groups = new Map<number, typeof availableProducts>()
  for (const p of availableProducts) {
    const c = orderCounts[p.id] ?? 0
    const bucket = groups.get(c) ?? []
    bucket.push(p)
    groups.set(c, bucket)
  }
  const countsDesc = [...groups.keys()].sort((a, b) => b - a)
  const ranked: typeof availableProducts = []
  for (const c of countsDesc) {
    const bucket = [...(groups.get(c) ?? [])]
    for (let i = bucket.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[bucket[i], bucket[j]] = [bucket[j], bucket[i]]
    }
    ranked.push(...bucket)
  }
  const pizzas = ranked.slice(0, 4)

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

  // Delivery zones for the homepage coverage map
  const { data: deliveryZonesData } = await supabase
    .from('delivery_zones')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  const deliveryZones = (deliveryZonesData || []) as DeliveryZone[]

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

  // Hero showcase: round pizzas that spin around their own center and crossfade.
  // Drop your photos into public/hero/ as pizza-N.png to extend this lineup.
  const heroSlides: HeroSlide[] = [
    { src: '/hero/pizza-1.png', alt: 'Pizza prosciutto e basilico' },
    { src: '/hero/pizza-2.png', alt: 'Pizza margherita' },
    { src: '/hero/pizza-3.png', alt: 'Pizza ai capperi' },
    { src: '/hero/pizza-4.png', alt: 'Pizza prosciutto e rucola' },
    { src: '/hero/pizza-5.png', alt: 'Pizza salsiccia e cipolla' },
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background photo */}
        <div className="absolute inset-0 z-0" aria-hidden>
          <Image
            src="/images/pizzak-bg.png"
            alt=""
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-background/80" />
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-4 md:py-8 lg:py-12 relative z-10">
          {/*
            Mobile flow (single column): title block → spinning pizzas → rest of copy.
            Desktop (lg+): title and rest of copy stack in the left column while the
            spinning pizzas occupy the right column spanning both rows.
          */}
          <div className="grid gap-0 lg:gap-8 xl:gap-12 lg:grid-cols-[2fr_3fr] lg:grid-rows-[auto_1fr]">
            {/* 1) Title block — on mobile the hanging sign sits up here at
                title height; on desktop it moves to the pizza column. */}
            <div className="relative z-[1] space-y-5 lg:col-start-1 lg:row-start-1 lg:self-end">
              <HeroSign className="lg:hidden absolute -top-2 right-0 w-24 sm:w-28 z-20 -rotate-3" />
              <div className="animate-fade-in-up relative w-[clamp(210px,27vw,390px)] aspect-square">
                <Image src="/hero/logo-hero.png" alt="Terra Verde Pizzéria" fill className="object-contain" priority />
              </div>
            </div>

            {/* 2) Round pizza showcase + hanging open/closed sign (desktop) */}
            <div className="animate-fade-in animation-delay-200 -mt-16 sm:-mt-10 lg:mt-0 pb-2 lg:pb-0 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-center relative">
              <HeroSign className="hidden lg:block absolute -top-6 -right-4 w-36 z-20 -rotate-3 hover:rotate-0 transition-transform duration-500" />
              <div className="relative max-w-[520px] sm:max-w-[640px] lg:max-w-[700px] mx-auto">
                <div className="pizza-peel-bg-mobile" aria-hidden>
                  <Image src="/hero/pizza-peel2.png" alt="" width={1024} height={1536} className="w-full h-auto" priority={false} />
                </div>
                <HeroCarousel
                  slides={heroSlides}
                  intervalMs={5000}
                  spinSeconds={50}
                  href={`/${locale}/menu`}
                  className="max-w-[520px] sm:max-w-[640px] lg:max-w-[700px] mx-auto"
                />
              </div>
            </div>

            {/* 3) Rest of the copy */}
            <div className="relative z-[1] space-y-5 pt-6 lg:pt-0 lg:col-start-1 lg:row-start-2 lg:self-start">
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

              <div className="animate-fade-in-up animation-delay-500 flex flex-col gap-4 sm:flex-row pt-2">
                <Button asChild size="lg" className="cta-glow gap-2 text-base h-12 px-8 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                  <Link href={`/${locale}/menu`}>
                    {t.hero.cta}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base h-12 px-8 rounded-full hover:bg-muted/70 transition-all">
                  <Link href={`/${locale}/about`}>
                    {locale === 'hu' ? 'Rólunk' : 'About Us'}
                  </Link>
                </Button>
              </div>
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
          <div className="grid gap-x-8 gap-y-6 py-7 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Clock,
                label: locale === 'hu' ? 'Ma nyitva' : 'Open today',
                value: todayHours?.closed
                  ? (locale === 'hu' ? 'Zárva' : 'Closed')
                  : `${todayHours?.open || '11:00'} – ${todayHours?.close || '22:00'}`,
              },
              {
                icon: Phone,
                label: locale === 'hu' ? 'Rendelés' : 'Order',
                value: storeInfo.phone || '+36 30 173 5918',
                href: `tel:${storeInfo.phone || '+36 30 173 5918'}`,
              },
              {
                icon: MapPin,
                label: locale === 'hu' ? 'Címünk' : 'Address',
                value: storeInfo.address || '2040 Budaörs, Szabadság út 23-25.',
              },
              {
                icon: Mail,
                label: 'Email',
                value: storeInfo.email || 'terraverdepizzeria@gmail.com',
                href: `mailto:${storeInfo.email || 'terraverdepizzeria@gmail.com'}`,
              },
            ].map((info, i) => {
              const Icon = info.icon
              return (
                <ScrollReveal
                  key={info.label}
                  delay={i * 80}
                  className="group flex items-center gap-4 lg:[&:not(:first-child)]:border-l lg:[&:not(:first-child)]:border-border/60 lg:[&:not(:first-child)]:pl-8"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15 transition-all duration-500 group-hover:rotate-6 group-hover:scale-105 group-hover:bg-primary/15">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {info.label}
                    </p>
                    {info.href ? (
                      <a href={info.href} className="font-semibold hover:text-primary transition-colors break-words">
                        {info.value}
                      </a>
                    ) : (
                      <p className="font-semibold">{info.value}</p>
                    )}
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured Pizzas */}
      <section className="relative pt-20 md:pt-28 pb-12 md:pb-16 overflow-hidden">
        {/* Pizza hot-air balloons — one drifts left → right across the section,
            then 10s later the other balloon does the same. 60s loop. */}
        <div className="balloon-cross" aria-hidden>
          <Image src="/hero/balloon-1.png" alt="" fill sizes="24vw" className="object-contain" priority={false} />
        </div>
        <div className="balloon-cross balloon-cross-2" aria-hidden>
          <Image src="/hero/balloon-2.png" alt="" fill sizes="24vw" className="object-contain" priority={false} />
        </div>
        <div className="container mx-auto px-4 relative">
          <ScrollReveal className="mb-14 text-center pt-8">
            <div className="inline-flex items-center gap-3 mb-5">
              <span className="h-px w-10 bg-accent/50" />
              <span className="text-accent font-serif italic text-xs tracking-[0.25em] uppercase">
                {locale === 'hu' ? 'Frissen készítve' : 'Freshly Made'}
              </span>
              <span className="h-px w-10 bg-accent/50" />
            </div>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              {locale === 'hu' ? 'Népszerű pizzáink' : 'Popular Pizzas'}
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {locale === 'hu'
                ? 'Fedezd fel legkedveltebb pizzáinkat, amelyeket 48 órán át kelesztett tésztából és prémium olasz alapanyagokból készítünk.'
                : 'Discover our most loved pizzas, made with 48-hour fermented dough and premium Italian ingredients.'}
            </p>
          </ScrollReveal>
          
          <FeaturedPizzas pizzas={pizzas || []} locale={locale} dictionary={dictionary} />

          <div className="mt-10 flex flex-col items-center gap-6">
            <ScrollReveal>
              <div className="relative w-24 sm:w-28 md:w-32 aspect-[2/3]">
                <Image
                  src="/hero/pizza-boat.png"
                  alt={locale === 'hu' ? 'Pizza vitorláshajó illusztráció' : 'Pizza sailboat illustration'}
                  fill
                  className="object-contain mix-blend-multiply dark:mix-blend-normal"
                  sizes="(max-width: 768px) 50vw, 256px"
                />
              </div>
            </ScrollReveal>
            <ScrollReveal>
              <Button asChild size="lg" className="gap-2 text-base h-12 px-8">
                <Link href={`/${locale}/menu`}>
                  {t.nav.viewMenu}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Delivery coverage map */}
      {deliveryZones.length > 0 && (
        <section className="relative pt-4 md:pt-6 pb-20 md:pb-28 overflow-hidden">
          <div className="container mx-auto px-4 max-w-5xl">
            <ScrollReveal className="mb-10 text-center">
              <div className="inline-flex items-center gap-3 mb-5">
                <span className="h-px w-10 bg-accent/50" />
                <span className="text-accent font-serif italic text-xs tracking-[0.25em] uppercase">
                  {locale === 'hu' ? 'Házhozszállítás' : 'Home delivery'}
                </span>
                <span className="h-px w-10 bg-accent/50" />
              </div>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                {locale === 'hu' ? 'Hova szállítunk?' : 'Where We Deliver'}
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {locale === 'hu'
                  ? 'Nézd meg a térképen, hogy a címedre várható-e kiszállítás. A részletekért kattints egy területre.'
                  : 'Check the map to see if we deliver to your address. Click a zone for details.'}
              </p>
            </ScrollReveal>
            <ScrollReveal>
              <DeliveryZonesMapOnly zones={deliveryZones} locale={locale} />
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* Why Choose Us — refined */}
      <section className="relative bg-muted/30 pt-24 md:pt-32 pb-8 md:pb-10 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="container mx-auto px-4 relative">
          <ScrollReveal className="mb-16 text-center">
            <div className="inline-flex items-center gap-3 mb-5">
              <span className="h-px w-10 bg-accent/50" />
              <span className="text-accent font-serif italic text-xs tracking-[0.25em] uppercase">
                Terra Verde
              </span>
              <span className="h-px w-10 bg-accent/50" />
            </div>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              {locale === 'hu' ? 'Miért minket válassz?' : 'Why Choose Us?'}
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto leading-relaxed">
              {locale === 'hu'
                ? 'Három dolog, amitől más a Terra Verde pizzája.'
                : 'Three things that make Terra Verde different.'}
            </p>
          </ScrollReveal>

          <div className="grid gap-6 lg:gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            {[
              {
                icon: Leaf,
                title: locale === 'hu' ? 'Friss alapanyagok' : 'Fresh Ingredients',
                desc:
                  locale === 'hu'
                    ? 'Minden nap friss, helyi termelőktől származó alapanyagokat használunk.'
                    : 'We use fresh, locally sourced ingredients every single day.',
              },
              {
                icon: ChefHat,
                title: locale === 'hu' ? 'Hagyományos receptek' : 'Traditional Recipes',
                desc:
                  locale === 'hu'
                    ? 'Eredeti olasz receptek, generációkon át öröklődő tudással.'
                    : 'Authentic Italian recipes passed down through generations.',
              },
              {
                icon: Truck,
                title: locale === 'hu' ? 'Gyors kiszállítás' : 'Fast Delivery',
                desc:
                  locale === 'hu'
                    ? 'Rendelésed 1 órán belül nálad van.'
                    : 'Your order arrives in under 1 hour.',
              },
            ].map((f, i) => {
              const Icon = f.icon
              return (
                <ScrollReveal key={f.title} delay={i * 120}>
                  <article className="feature-card group h-full">
                    <span className="feature-num" aria-hidden>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="feature-icon">
                      <Icon className="h-9 w-9" />
                    </div>
                    <h3 className="font-serif text-xl font-semibold tracking-tight mb-2">
                      {f.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                  </article>
                </ScrollReveal>
              )
            })}
          </div>

        </div>
      </section>

      {/* CTA Section — refined */}
      <section className="relative pt-4 pb-20 md:pb-28 overflow-hidden">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex justify-center mb-0 relative z-10">
            <ScrollReveal>
              <div className="relative w-40 sm:w-48 md:w-56 aspect-[3/2]">
                <Image
                  src="/hero/pizza-bike.png"
                  alt={locale === 'hu' ? 'Pizza kerékpár illusztráció' : 'Pizza bicycle illustration'}
                  fill
                  className="object-contain drop-shadow-2xl"
                  sizes="(max-width: 768px) 50vw, 224px"
                />
              </div>
            </ScrollReveal>
          </div>
          <ScrollReveal>
            <div className="cta-card relative overflow-hidden rounded-[2rem] px-6 py-14 sm:px-12 sm:py-20 lg:py-24 text-center text-primary-foreground">
              <Image
                src="/images/pizzak.jpg"
                alt=""
                fill
                aria-hidden
                priority={false}
                className="cta-card-photo object-cover"
              />
              <div className="cta-card-tint" aria-hidden />
              <div className="cta-card-grain" aria-hidden />

              <div className="relative z-10">
                <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-5 tracking-tight drop-shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
                  {locale === 'hu' ? 'Éhes vagy?' : 'Feeling Hungry?'}
                </h2>
                <p className="text-primary-foreground/85 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
                  {locale === 'hu'
                    ? 'Rendelj most és élvezd a frissen készült pizzák ízét — egy órán belül nálad van.'
                    : 'Order now and enjoy the taste of freshly made pizzas — at your door within an hour.'}
                </p>

                <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-primary hover:bg-white/95 hover:scale-[1.02] h-12 px-8 text-base font-semibold shadow-xl shadow-black/20 transition-all"
                  >
                    <Link href={`/${locale}/menu`}>
                      {t.hero.cta}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    size="lg"
                    className="text-primary-foreground hover:bg-white/10 hover:text-white h-12 px-6 border border-white/20"
                  >
                    <a href={`tel:${storeInfo.phone || '+36 30 173 5918'}`}>
                      <Phone className="mr-2 h-5 w-5" />
                      <span className="font-medium">
                        {storeInfo.phone || '+36 30 173 5918'}
                      </span>
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
