import type { Locale } from '@/lib/i18n/config'
import { SettingsForm } from '@/components/admin/settings-form'
import { createClient } from '@/lib/supabase/server'
import type { DeliveryZone } from '@/lib/types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  return {
    title: locale === 'hu' ? 'Admin - Beállítások' : 'Admin - Settings',
  }
}

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const supabase = await createClient()

  // Fetch delivery zones
  const { data: zonesData } = await supabase
    .from('delivery_zones')
    .select('*')
    .order('sort_order', { ascending: true })

  const deliveryZones = (zonesData || []) as DeliveryZone[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold md:text-3xl">
          {locale === 'hu' ? 'Beállítások' : 'Settings'}
        </h1>
        <p className="text-muted-foreground">
          {locale === 'hu' 
            ? 'Étterem beállítások, nyitvatartás és szállítási opciók kezelése' 
            : 'Manage restaurant settings, opening hours and delivery options'
          }
        </p>
      </div>
      
      <SettingsForm locale={locale} deliveryZones={deliveryZones} />
    </div>
  )
}
