import Image from 'next/image'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import type { Locale } from '@/lib/i18n/config'
import { UpdatePasswordForm } from '@/components/auth/update-password-form'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  return {
    title: locale === 'hu' ? 'Új jelszó' : 'New password',
  }
}

export default async function UpdatePasswordPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dictionary = await getDictionary(locale)

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center">
      <div className="absolute inset-0 z-0" aria-hidden>
        <Image src="/images/pizzak-bg.png" alt="" fill className="object-cover object-center" priority />
        <div className="absolute inset-0 bg-background/80" />
      </div>
      <div className="container mx-auto px-4 max-w-md relative z-10 py-12 md:py-24">
        <UpdatePasswordForm locale={locale} dictionary={dictionary} />
      </div>
    </div>
  )
}
