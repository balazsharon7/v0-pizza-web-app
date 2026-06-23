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
    title: locale === 'hu' ? 'Általános Szerződési Feltételek' : 'Terms & Conditions',
    description:
      locale === 'hu'
        ? 'A Terra Verde Pizzéria online rendelési szolgáltatásának általános szerződési feltételei.'
        : 'Terms and conditions of the Terra Verde Pizzéria online ordering service.',
  }
}

export default async function AszfPage({ params }: PageProps) {
  const { locale } = await params
  const store = await getStoreInfo()
  const isHu = locale === 'hu'

  return (
    <LegalShell
      locale={locale}
      title={isHu ? 'Általános Szerződési Feltételek' : 'Terms & Conditions'}
      subtitle={isHu ? 'Hatályos: [dátum]' : 'Effective: [date]'}
    >
      {!isHu && (
        <p>
          These terms are provided in Hungarian, as the contract is governed by
          Hungarian law. An English summary is available on request.
        </p>
      )}

      <h2>1. A szolgáltató</h2>
      <p>
        A jelen Általános Szerződési Feltételek (a továbbiakban: <strong>ÁSZF</strong>) a{' '}
        <strong>[Cégnév Kft.]</strong> (székhely: [cím]; adószám: [00000000-0-00];
        a továbbiakban: <strong>Szolgáltató</strong>) által üzemeltetett Terra Verde
        Pizzéria weboldalon keresztül leadott rendelésekre vonatkoznak.
      </p>
      <ul>
        <li>Telephely: {store.address}</li>
        <li>Telefon: {store.phone}</li>
        <li>E-mail: {store.email}</li>
      </ul>

      <h2>2. A megrendelés menete</h2>
      <p>
        A Vásárló a termékeket a kosárba helyezve, majd a rendelési adatok
        (név, telefonszám, szállítási cím vagy átvételi mód) megadásával adhatja le
        rendelését. A „Rendelés leadása” gombra kattintással a Vásárló fizetési
        kötelezettséggel járó megrendelést ad le.
      </p>
      <p>
        A szerződés a rendelés Szolgáltató általi visszaigazolásával jön létre.
        A Szolgáltató a rendelést telefonon vagy e-mailben igazolja vissza.
      </p>

      <h2>3. Árak</h2>
      <p>
        A weboldalon feltüntetett árak forintban értendők és tartalmazzák az
        általános forgalmi adót (ÁFA). A szállítási díj — amennyiben felszámításra
        kerül — a megrendelés véglegesítése előtt külön feltüntetésre kerül.
        A Szolgáltató fenntartja az árváltoztatás jogát; ez a már visszaigazolt
        rendeléseket nem érinti.
      </p>

      <h2>4. Szállítás és átvétel</h2>
      <ul>
        <li>
          <strong>Házhozszállítás:</strong> a megadott szállítási zónákon belül,
          a weboldalon jelzett minimum rendelési összeg felett.
        </li>
        <li>
          <strong>Személyes átvétel:</strong> a telephelyen, nyitvatartási időben.
        </li>
      </ul>
      <p>
        A megadott szállítási idők tájékoztató jellegűek, és a forgalomtól,
        időjárástól, valamint a leadott rendelések számától függően változhatnak.
      </p>

      <h2>5. Fizetés</h2>
      <p>
        A fizetés az átvételkor történik készpénzben vagy bankkártyával. A weboldal
        jelenleg nem fogad online fizetést.
      </p>

      <h2>6. Elállási jog</h2>
      <p>
        A fogyasztó és a vállalkozás közötti szerződések részletes szabályairól szóló
        45/2014. (II. 26.) Korm. rendelet 29. § (1) bekezdés d) és e) pontja alapján a
        Vásárlót <strong>nem illeti meg az elállási jog</strong> olyan romlandó vagy
        minőségét rövid ideig megőrző termék (elkészített étel, ital) tekintetében,
        amely a megrendelést követően, a Vásárló kifejezett kérésére kerül elkészítésre.
      </p>
      <p>
        A már visszaigazolt és elkészítés alatt álló rendelés ezért utólag nem
        mondható le. A rendelés esetleges módosítását vagy lemondását a Vásárló a
        visszaigazolást követően haladéktalanul, telefonon jelezheti; ennek
        elfogadása a Szolgáltató mérlegelési körébe tartozik.
      </p>

      <h2>7. Szavatosság, hibás teljesítés</h2>
      <p>
        Amennyiben a kiszállított termék hibás (pl. téves összeállítás, minőségi
        kifogás), a Vásárló az átvételt követően haladéktalanul, de legkésőbb a
        kiszállítás napján köteles ezt a Szolgáltatónak jelezni a fenti
        elérhetőségek valamelyikén. A Szolgáltató a jogos kifogást a termék cseréjével
        vagy a vételár visszatérítésével orvosolja.
      </p>

      <h2>8. Panaszkezelés</h2>
      <p>
        A Vásárló panaszát a {store.email} e-mail címen vagy a {store.phone}{' '}
        telefonszámon teheti meg. A Szolgáltató az írásbeli panaszt a beérkezéstől
        számított 30 napon belül kivizsgálja és megválaszolja.
      </p>
      <p>
        Békéltető testület: a fogyasztó lakóhelye szerint illetékes békéltető testülethez
        fordulhat. A Szolgáltató székhelye szerinti testület: [Békéltető Testület megnevezése,
        címe]. Online vitarendezési platform:{' '}
        <a href="https://ec.europa.eu/odr" target="_blank" rel="noopener noreferrer">
          ec.europa.eu/odr
        </a>.
      </p>

      <h2>9. Adatkezelés</h2>
      <p>
        A személyes adatok kezeléséről az{' '}
        <a href={`/${locale}/adatkezeles`}>Adatkezelési tájékoztató</a> rendelkezik.
      </p>

      <h2>10. Záró rendelkezések</h2>
      <p>
        A jelen ÁSZF-ben nem szabályozott kérdésekben a magyar jog, különösen a Polgári
        Törvénykönyv vonatkozó rendelkezései az irányadók. A Szolgáltató jogosult az
        ÁSZF-et egyoldalúan módosítani; a módosítás a weboldalon való közzététellel lép
        hatályba.
      </p>

      <p>
        {isHu
          ? 'A szögletes zárójelben szereplő adatokat publikálás előtt ki kell tölteni, és javasolt jogi szakértővel véglegesíteni.'
          : 'The bracketed fields must be completed before publishing; legal review is recommended.'}
      </p>
    </LegalShell>
  )
}
