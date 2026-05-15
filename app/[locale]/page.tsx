import Link from 'next/link'
import Image from 'next/image'
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
        {/* Interactive shader-style background — follows the pointer and ripples on click */}
        <AuroraBg className="opacity-75" intensity={1.2} />

        {/* Content */}
        <div className="container mx-auto px-4 py-16 md:py-24 lg:py-28 relative z-10">
          <div className="grid lg:grid-cols-[1fr_1.7fr] gap-10 lg:gap-12 items-center">
            <div className="space-y-6 lg:order-1">
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

            {/* Round pizza showcase — each pizza spins around its center, crossfades to the next.
                Clicking anywhere on the pizza takes the visitor straight to the menu. */}
            <div className="lg:order-2 animate-fade-in animation-delay-200 pb-8">
              <HeroCarousel
                slides={heroSlides}
                intervalMs={5000}
                spinSeconds={50}
                href={`/${locale}/menu`}
                className="max-w-[560px] sm:max-w-[760px] lg:max-w-none lg:w-full mx-auto"
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

      {/* Why Choose Us — refined */}
      <section className="relative bg-muted/30 py-24 md:py-32 overflow-hidden">
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
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="container mx-auto px-4 max-w-6xl">
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
                    <a href={`tel:${storeInfo.phone || '+36 1 234 5678'}`}>
                      <Phone className="mr-2 h-5 w-5" />
                      <span className="font-medium">
                        {storeInfo.phone || '+36 1 234 5678'}
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
