import Image from 'next/image'
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
    <div className="relative py-12 md:py-16 overflow-hidden">
      <div className="balloon-cross" aria-hidden>
        <Image src="/hero/balloon-1.png" alt="" fill sizes="14vw" className="object-contain" priority={false} />
      </div>
      <div className="balloon-cross balloon-cross-2" aria-hidden>
        <Image src="/hero/balloon-2.png" alt="" fill sizes="14vw" className="object-contain" priority={false} />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="mb-10 pt-4 animate-fade-in-up">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 justify-center">
            <div className="text-center md:text-left">
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
              <p className="mt-4 text-muted-foreground max-w-xl leading-relaxed">
                {locale === 'hu'
                  ? 'Válassz kategóriát, és rendeld meg a kedvenced — minden pizza kézzel készül, fa-tüzelésű kemencében.'
                  : 'Pick a category and order your favorite — every pizza is hand-made in a wood-fired oven.'}
              </p>
            </div>
            <div className="relative w-44 md:w-56 lg:w-64 aspect-[4/3] rotate-2 drop-shadow-2xl shrink-0">
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
