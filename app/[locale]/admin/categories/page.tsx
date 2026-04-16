import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import type { Locale } from '@/lib/i18n/config'
import { CategoriesList } from '@/components/admin/categories-list'

interface CategoriesPageProps {
  params: Promise<{ locale: Locale }>
}

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { locale } = await params
  const supabase = await createClient()
  const t = await getDictionary(locale)

  // Check admin access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect(`/${locale}`)

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')

  return (
    <div className="space-y-6">
      <CategoriesList
        categories={categories || []}
        locale={locale}
        dictionary={t}
      />
    </div>
  )
}
