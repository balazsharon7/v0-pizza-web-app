import { getDictionary } from '@/lib/i18n/get-dictionary'
import type { Locale } from '@/lib/i18n/config'
import { createClient } from '@/lib/supabase/server'
import { MenuContent } from '@/components/menu-content'
import type { Category, Product, Size, Topping } from '@/lib/types'

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
    <div className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center section-divider pt-8 animate-fade-in-up">
          <span className="inline-block text-accent font-serif italic text-sm tracking-wide mb-3">
            {locale === 'hu' ? 'Fedezd fel kínálatunkat' : 'Explore our selection'}
          </span>
          <h1 className="font-serif text-3xl font-bold md:text-4xl lg:text-5xl">
            {dictionary.menu.title}
          </h1>
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
