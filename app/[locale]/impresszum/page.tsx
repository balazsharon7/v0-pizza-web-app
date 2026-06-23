import type { Metadata } from 'next'
import type { Locale } from '@/lib/i18n/config'
import { LegalShell } from '@/components/legal/legal-shell'
import { getStoreInfo } from '@/lib/store-info'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'hu' ? 'Impresszum' : 'Imprint',
    description:
      locale === 'hu'
        ? 'A Terra Verde Pizzéria üzemeltetőjének adatai.'
        : 'Operator information for Terra Verde Pizzéria.',
  }
}

export default async function ImpresszumPage({ params }: PageProps) {
  const { locale } = await params
  const store = await getStoreInfo()
  const isHu = locale === 'hu'

  return (
    <LegalShell locale={locale} title={isHu ? 'Impresszum' : 'Imprint'}>
      {!isHu && (
        <p>
          The official operator information below is provided in Hungarian, as
          required by Hungarian law.
        </p>
      )}

      <h2>A szolgáltató adatai</h2>
      <ul>
        <li><strong>Cégnév:</strong> BetLux Food Bt.</li>
        <li><strong>Üzlet / telephely:</strong> {store.address}</li>
        <li><strong>Cégjegyzékszám:</strong> 13-06-071353</li>
        <li><strong>Adószám:</strong> 26342463-2-13</li>
        <li><strong>Nyilvántartó hatóság:</strong> Budapest Környéki Törvényszék Cégbírósága</li>
        <li><strong>Székhely:</strong> [Székhely – kérjük pótold a cégadatból]</li>
        <li><strong>Képviselő:</strong> [Képviselő neve – kérjük pótold]</li>
      </ul>

      <h2>Elérhetőség</h2>
      <ul>
        <li><strong>Telefon:</strong> <a href={`tel:${store.phone.replace(/\s/g, '')}`}>{store.phone}</a></li>
        <li><strong>E-mail:</strong> <a href={`mailto:${store.email}`}>{store.email}</a></li>
      </ul>

      <h2>Tárhelyszolgáltató</h2>
      <ul>
        <li><strong>Név:</strong> Vercel Inc.</li>
        <li><strong>Cím:</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, USA</li>
        <li><strong>Weboldal:</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a></li>
      </ul>

      <h2>Adatbázis / háttérszolgáltatás</h2>
      <ul>
        <li><strong>Név:</strong> Supabase Inc.</li>
        <li><strong>Weboldal:</strong> <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">supabase.com</a></li>
      </ul>

      <p>
        {isHu
          ? 'A szögletes zárójelben maradt két mező (székhely, képviselő neve) a hivatalos cégadatokból pótolható.'
          : 'The two remaining bracketed fields (registered seat, representative) can be completed from the official company records.'}
      </p>
    </LegalShell>
  )
}
