import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Locale } from '@/lib/i18n/config'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { getDictionary } from '@/lib/i18n/get-dictionary'

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dictionary = await getDictionary(locale)
  const supabase = await createClient()

  // Check if user is authenticated and is admin
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect(`/${locale}`)
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <AdminSidebar locale={locale} dictionary={dictionary} />
      <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
        {children}
      </main>
    </div>
  )
}
