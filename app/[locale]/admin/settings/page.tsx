import type { Locale } from '@/lib/i18n/config'
import { SettingsForm } from '@/components/admin/settings-form'

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
      
      <SettingsForm locale={locale} />
    </div>
  )
}
