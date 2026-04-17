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

  return (
    <div className="space-y-6">
      <UsersList
        locale={locale}
        dictionary={t}
      />
    </div>
  )
}
