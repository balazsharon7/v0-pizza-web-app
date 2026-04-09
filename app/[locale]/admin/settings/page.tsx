import type { Locale } from '@/lib/i18n/config'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
      <h1 className="font-serif text-2xl font-bold md:text-3xl">
        {locale === 'hu' ? 'Beállítások' : 'Settings'}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>{locale === 'hu' ? 'Étterem adatok' : 'Restaurant Info'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {locale === 'hu' 
              ? 'A beállítások kezelése hamarosan elérhető lesz.'
              : 'Settings management coming soon.'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
