import { createClient } from '@/lib/supabase/server'
import type { Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { ProductsList } from '@/components/admin/products-list'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  return {
    title: locale === 'hu' ? 'Admin - Termékek' : 'Admin - Products',
  }
}

export default async function AdminProductsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dictionary = await getDictionary(locale)
  const supabase = await createClient()

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from('products').select('*, category:categories(*)').order('sort_order'),
    supabase.from('categories').select('*').order('sort_order'),
  ])

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold md:text-3xl">
        {locale === 'hu' ? 'Termékek' : 'Products'}
      </h1>

      <ProductsList 
        products={products || []} 
        categories={categories || []}
        locale={locale} 
        dictionary={dictionary} 
      />
    </div>
  )
}
