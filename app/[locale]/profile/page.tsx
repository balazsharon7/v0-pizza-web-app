import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import type { Locale } from '@/lib/i18n/config'
import { ProfileContent } from '@/components/profile/profile-content'

interface ProfilePageProps {
  params: Promise<{ locale: Locale }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect(`/${locale}/auth/login`)
  }
  
  const t = await getDictionary(locale)
  
  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  // Fetch user orders with items
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        product:products (name_hu, name_en),
        size:sizes (name_hu, name_en)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  return (
    <main className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <ProfileContent 
          user={user}
          profile={profile}
          orders={orders || []}
          locale={locale}
          t={t}
        />
      </div>
    </main>
  )
}
