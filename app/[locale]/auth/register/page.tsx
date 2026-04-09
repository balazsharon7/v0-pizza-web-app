import { getDictionary } from '@/lib/i18n/get-dictionary'
import type { Locale } from '@/lib/i18n/config'
import { RegisterForm } from '@/components/auth/register-form'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  return {
    title: locale === 'hu' ? 'Regisztráció' : 'Register',
  }
}

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dictionary = await getDictionary(locale)

  return (
    <div className="py-12 md:py-24">
      <div className="container mx-auto px-4 max-w-md">
        <RegisterForm locale={locale} dictionary={dictionary} />
      </div>
    </div>
  )
}
