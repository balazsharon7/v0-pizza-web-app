import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import type { Locale } from '@/lib/i18n/config'
import { SettlementsList } from '@/components/admin/settlements-list'
import type { DeliverySettlement, DeliveryZone } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  return {
    title: locale === 'hu' ? 'Települések - Admin' : 'Settlements - Admin',
  }
}

export default async function SettlementsAdminPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dictionary = await getDictionary(locale)
  const supabase = await createClient()

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect(`/${locale}/login`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect(`/${locale}`)
  }

  // Fetch settlements
  const { data: settlementsData } = await supabase
    .from('delivery_settlements')
    .select('*')
    .order('name', { ascending: true })

  const settlements = (settlementsData || []) as DeliverySettlement[]

  // Fetch zones
  const { data: zonesData } = await supabase
    .from('delivery_zones')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const zones = (zonesData || []) as DeliveryZone[]

  return (
    <div className="container mx-auto px-4 py-8">
      <SettlementsList 
        settlements={settlements} 
        zones={zones} 
        locale={locale} 
      />
    </div>
  )
}
