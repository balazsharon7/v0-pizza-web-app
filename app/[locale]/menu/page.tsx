import { getDictionary } from '@/lib/i18n/get-dictionary'
import type { Locale } from '@/lib/i18n/config'
import { createClient } from '@/lib/supabase/server'
import { MenuContent } from '@/components/menu-content'
import type { Category, Product, Size, Topping } from '@/lib/types'
import { AuroraBg } from '@/components/animations/aurora-bg'

// Disable caching to always show fresh data
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  return {
    title: locale === 'hu' ? 'Étlap' : 'Menu',
    description: locale === 'hu' 
      ? 'Böngészd át teljes étlapunkat és rendelj online!'
      : 'Browse our full menu and order online!',
  }
}

export default async function MenuPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dictionary = await getDictionary(locale)
  
  const supabase = await createClient()
  
  // Fetch all data in parallel
  const [categoriesResult, productsResult, sizesResult, toppingsResult] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('products')
      .select('*')
      .eq('is_available', true)
      .order('sort_order'),
    supabase
      .from('sizes')
      .select('*')
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('toppings')
      .select('*')
      .eq('is_available', true)
      .order('sort_order'),
  ])

  const categories = (categoriesResult.data || []) as Category[]
  const products = (productsResult.data || []) as Product[]
  const sizes = (sizesResult.data || []) as Size[]
  const toppings = (toppingsResult.data || []) as Topping[]

  return (
    <div className="relative py-12 md:py-16 overflow-hidden">
      <AuroraBg className="opacity-55" intensity={1} />
      <div className="container mx-auto px-4 relative z-10">
        <div className="mb-10 text-center pt-4 animate-fade-in-up">
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="h-px w-10 bg-accent/50" />
            <span className="text-accent font-serif italic text-xs tracking-[0.25em] uppercase">
              {locale === 'hu' ? 'Fedezd fel kínálatunkat' : 'Explore our selection'}
            </span>
            <span className="h-px w-10 bg-accent/50" />
          </div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            {dictionary.menu.title}
          </h1>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {locale === 'hu'
              ? 'Válassz kategóriát, és rendeld meg a kedvenced — minden pizza kézzel készül, fa-tüzelésű kemencében.'
              : 'Pick a category and order your favorite — every pizza is hand-made in a wood-fired oven.'}
          </p>
        </div>
        
        <MenuContent
          categories={categories}
          products={products}
          sizes={sizes}
          toppings={toppings}
          locale={locale}
          dictionary={dictionary}
        />
      </div>
    </div>
  )
}
