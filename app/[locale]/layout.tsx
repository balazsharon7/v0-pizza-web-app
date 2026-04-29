import type { Metadata } from 'next'
import { DM_Sans, Fraunces } from 'next/font/google'
import { notFound } from 'next/navigation'
import { locales, type Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { CartProvider } from '@/lib/cart-context'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CartSheet } from '@/components/cart-sheet'
import { Toaster } from '@/components/ui/sonner'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces' })

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const isHu = locale === 'hu'
  
  return {
    title: {
      default: 'Terra Verde Pizza',
      template: '%s | Terra Verde Pizza',
    },
    description: isHu 
      ? 'Autentikus olasz pizza friss, helyi alapanyagokból. Rendelj online!'
      : 'Authentic Italian pizza made with fresh, local ingredients. Order online!',
    openGraph: {
      title: 'Terra Verde Pizza',
      description: isHu
        ? 'Autentikus olasz pizza friss, helyi alapanyagokból'
        : 'Authentic Italian pizza made with fresh, local ingredients',
      type: 'website',
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  
  if (!locales.includes(locale)) {
    notFound()
  }

  const dictionary = await getDictionary(locale)

  return (
    <div className={`${dmSans.variable} ${fraunces.variable} min-h-screen flex flex-col font-sans`}>
      <CartProvider>
        <Header locale={locale} dictionary={dictionary} />
        <main className="flex-1">
          {children}
        </main>
        <Footer locale={locale} dictionary={dictionary} />
        <CartSheet locale={locale} dictionary={dictionary} />
        <Toaster position="top-center" />
      </CartProvider>
    </div>
  )
}
