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

  // Check if user is admin. Try the profiles table first; if that errors
  // (e.g. RLS recursion before scripts/005_fix_rls_recursion.sql has been
  // applied), fall back to the JWT user_metadata flag so a real admin isn't
  // locked out of their own panel by a database policy bug.
  let isAdmin = false
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.warn('[admin layout] profile fetch failed', profileError)
    const meta = user.user_metadata as { is_admin?: boolean } | undefined
    isAdmin = !!meta?.is_admin
  } else {
    isAdmin = !!profile?.is_admin
  }

  if (!isAdmin) {
    redirect(`/${locale}`)
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
      <AdminSidebar locale={locale} dictionary={dictionary} />
      <main className="flex-1 overflow-y-auto bg-muted/30 p-4 lg:p-6">
        {children}
      </main>
    </div>
  )
}
