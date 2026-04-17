import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import type { Locale } from '@/lib/i18n/config'
import { UsersList } from '@/components/admin/users-list'

interface UsersPageProps {
  params: Promise<{ locale: Locale }>
}

export default async function UsersPage({ params }: UsersPageProps) {
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

  // Fetch all users
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch order counts separately for each user
  const users = await Promise.all(
    (profiles || []).map(async (profile) => {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
      
      return {
        ...profile,
        orders: [{ count: count || 0 }]
      }
    })
  )

  return (
    <div className="space-y-6">
      <UsersList
        users={users || []}
        locale={locale}
        dictionary={t}
      />
    </div>
  )
}
