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
    title: locale === 'hu' ? 'Allergén információ' : 'Allergen Information',
    description:
      locale === 'hu'
        ? 'A 14 kötelezően jelölendő allergén és tájékoztatás a Terra Verde Pizzériában.'
        : 'The 14 mandatory allergens and information at Terra Verde Pizzéria.',
  }
}

// The 14 allergens listed in EU Regulation 1169/2011, Annex II.
const ALLERGENS: { hu: string; en: string }[] = [
  { hu: 'Glutént tartalmazó gabonafélék (búza, rozs, árpa, zab)', en: 'Cereals containing gluten (wheat, rye, barley, oats)' },
  { hu: 'Rákfélék és a belőlük készült termékek', en: 'Crustaceans and products thereof' },
  { hu: 'Tojás és a belőle készült termékek', en: 'Eggs and products thereof' },
  { hu: 'Hal és a belőle készült termékek', en: 'Fish and products thereof' },
  { hu: 'Földimogyoró és a belőle készült termékek', en: 'Peanuts and products thereof' },
  { hu: 'Szójabab és a belőle készült termékek', en: 'Soybeans and products thereof' },
  { hu: 'Tej és az abból készült termékek (laktóz)', en: 'Milk and products thereof (including lactose)' },
  { hu: 'Diófélék (mandula, mogyoró, dió, kesudió stb.)', en: 'Tree nuts (almond, hazelnut, walnut, cashew, etc.)' },
  { hu: 'Zeller és a belőle készült termékek', en: 'Celery and products thereof' },
  { hu: 'Mustár és a belőle készült termékek', en: 'Mustard and products thereof' },
  { hu: 'Szezámmag és a belőle készült termékek', en: 'Sesame seeds and products thereof' },
  { hu: 'Kén-dioxid és szulfitok (10 mg/kg felett)', en: 'Sulphur dioxide and sulphites (above 10 mg/kg)' },
  { hu: 'Csillagfürt (lupin) és a belőle készült termékek', en: 'Lupin and products thereof' },
  { hu: 'Puhatestűek és a belőlük készült termékek', en: 'Molluscs and products thereof' },
]

export default async function AllergenekPage({ params }: PageProps) {
  const { locale } = await params
  const store = await getStoreInfo()
  const isHu = locale === 'hu'

  return (
    <LegalShell
      locale={locale}
      title={isHu ? 'Allergén információ' : 'Allergen Information'}
    >
      <p>
        {isHu
          ? 'Az 1169/2011/EU rendelet alapján az alábbi 14 anyag, illetve termék minősül kötelezően jelölendő allergénnek. Termékeink olyan konyhában készülnek, ahol ezen összetevők bármelyike jelen lehet, ezért nyomokban más allergén is előfordulhat.'
          : 'Under EU Regulation 1169/2011, the following 14 substances or products are classified as mandatory allergens. Our products are prepared in a kitchen where any of these ingredients may be present, so traces of other allergens may occur.'}
      </p>

      <h2>{isHu ? 'A 14 kötelező allergén' : 'The 14 mandatory allergens'}</h2>
      <ol>
        {ALLERGENS.map((a) => (
          <li key={a.en}>{isHu ? a.hu : a.en}</li>
        ))}
      </ol>

      <h2>{isHu ? 'Egy adott termék allergénjei' : 'Allergens of a specific dish'}</h2>
      <p>
        {isHu ? (
          <>
            Egy konkrét termék pontos allergén-összetételéről munkatársaink készséggel
            adnak tájékoztatást. Kérjük, rendelés előtt jelezze allergiáját telefonon a{' '}
            <a href={`tel:${store.phone.replace(/\s/g, '')}`}>{store.phone}</a> számon,
            e-mailben a <a href={`mailto:${store.email}`}>{store.email}</a> címen, vagy
            személyesen az üzletünkben ({store.address}).
          </>
        ) : (
          <>
            Our staff are happy to provide detailed allergen information for any specific
            dish. Please let us know about your allergy before ordering by phone at{' '}
            <a href={`tel:${store.phone.replace(/\s/g, '')}`}>{store.phone}</a>, by e-mail
            at <a href={`mailto:${store.email}`}>{store.email}</a>, or in person at our
            store ({store.address}).
          </>
        )}
      </p>
    </LegalShell>
  )
}
