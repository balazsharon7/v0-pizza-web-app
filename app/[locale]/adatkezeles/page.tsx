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
    title: locale === 'hu' ? 'Adatkezelési tájékoztató' : 'Privacy Policy',
    description:
      locale === 'hu'
        ? 'Hogyan kezeli a Terra Verde Pizzéria a személyes adatokat.'
        : 'How Terra Verde Pizzéria handles personal data.',
  }
}

export default async function AdatkezelesPage({ params }: PageProps) {
  const { locale } = await params
  const store = await getStoreInfo()
  const isHu = locale === 'hu'

  return (
    <LegalShell
      locale={locale}
      title={isHu ? 'Adatkezelési tájékoztató' : 'Privacy Policy'}
      subtitle={isHu ? 'Hatályos: [dátum]' : 'Effective: [date]'}
    >
      {!isHu && (
        <p>
          This privacy notice is provided in Hungarian to comply with Hungarian
          and EU (GDPR) requirements.
        </p>
      )}

      <h2>1. Az adatkezelő</h2>
      <ul>
        <li><strong>Név:</strong> [Cégnév Kft.]</li>
        <li><strong>Székhely:</strong> [cím]</li>
        <li><strong>Telephely:</strong> {store.address}</li>
        <li><strong>E-mail:</strong> <a href={`mailto:${store.email}`}>{store.email}</a></li>
        <li><strong>Telefon:</strong> {store.phone}</li>
      </ul>

      <h2>2. A kezelt adatok köre, célja és jogalapja</h2>
      <h3>Rendelés teljesítése</h3>
      <p>
        Kezelt adatok: név, telefonszám, e-mail cím (opcionális), szállítási cím,
        rendelés tartalma és összege, megjegyzés.
      </p>
      <ul>
        <li><strong>Cél:</strong> a megrendelés feldolgozása, teljesítése, kapcsolattartás.</li>
        <li><strong>Jogalap:</strong> a szerződés teljesítése (GDPR 6. cikk (1) b)).</li>
        <li><strong>Megőrzési idő:</strong> a számviteli bizonylatok tekintetében a számvitelről szóló 2000. évi C. törvény szerint 8 év; egyébként a rendelés teljesítését követő [pl. 1 év].</li>
      </ul>

      <h3>Regisztráció / felhasználói fiók</h3>
      <p>Kezelt adatok: e-mail cím, jelszó (titkosítva tárolva), név, mentett címek.</p>
      <ul>
        <li><strong>Cél:</strong> a felhasználói fiók működtetése, rendelési előzmények.</li>
        <li><strong>Jogalap:</strong> az érintett hozzájárulása (GDPR 6. cikk (1) a)).</li>
        <li><strong>Megőrzési idő:</strong> a fiók törléséig.</li>
      </ul>

      <h3>Sütik (cookie-k)</h3>
      <p>
        A weboldal a működéshez szükséges sütiket, valamint — hozzájárulás esetén —
        statisztikai célú sütiket használ. A sütikről a weboldal alján megjelenő
        süti-tájékoztatóban rendelkezhet. A működéshez feltétlenül szükséges sütik
        jogalapja a Szolgáltató jogos érdeke (GDPR 6. cikk (1) f)).
      </p>

      <h2>3. Adatfeldolgozók</h2>
      <p>A Szolgáltató az alábbi adatfeldolgozókat veszi igénybe:</p>
      <ul>
        <li><strong>Vercel Inc.</strong> (USA) – tárhely- és üzemeltetési szolgáltatás.</li>
        <li><strong>Supabase Inc.</strong> – adatbázis, hitelesítés és tárolás.</li>
        <li><strong>Resend</strong> – tranzakciós e-mailek (pl. rendelés-visszaigazolás) kézbesítése.</li>
      </ul>
      <p>
        Az EU-n kívülre történő esetleges adattovábbítás megfelelő garanciák (pl. az
        Európai Bizottság általános szerződési feltételei) mellett történik.
      </p>

      <h2>4. Az érintett jogai</h2>
      <p>Az érintett a GDPR alapján jogosult:</p>
      <ul>
        <li>tájékoztatást kérni a kezelt adatairól (hozzáférés);</li>
        <li>a pontatlan adatok helyesbítését kérni;</li>
        <li>adatai törlését kérni („elfeledtetéshez való jog”);</li>
        <li>az adatkezelés korlátozását kérni;</li>
        <li>az adathordozhatósághoz való jogát gyakorolni;</li>
        <li>a hozzájárulását bármikor visszavonni;</li>
        <li>tiltakozni az adatkezelés ellen.</li>
      </ul>
      <p>
        Kérelmét a {store.email} címen jelezheti. A Szolgáltató a kérelmet legkésőbb
        egy hónapon belül megválaszolja.
      </p>

      <h2>5. Jogorvoslat</h2>
      <p>
        Az érintett panaszával a Nemzeti Adatvédelmi és Információszabadság
        Hatósághoz (NAIH) fordulhat:
      </p>
      <ul>
        <li>Cím: 1055 Budapest, Falk Miksa utca 9-11.</li>
        <li>Postacím: 1363 Budapest, Pf. 9.</li>
        <li>E-mail: ugyfelszolgalat@naih.hu</li>
        <li>Web: <a href="https://naih.hu" target="_blank" rel="noopener noreferrer">naih.hu</a></li>
      </ul>
      <p>Az érintett jogai megsértése esetén bírósághoz is fordulhat.</p>

      <p>
        {isHu
          ? 'A szögletes zárójelben szereplő adatokat és megőrzési időket az üzemeltetőnek a tényleges gyakorlatának megfelelően kell kitöltenie; jogi felülvizsgálat javasolt.'
          : 'The bracketed fields and retention periods must be completed to reflect the operator’s actual practice; legal review is recommended.'}
      </p>
    </LegalShell>
  )
}
