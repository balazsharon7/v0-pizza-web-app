import type { Metadata } from 'next'
import type { Locale } from '@/lib/i18n/config'
import { LegalShell } from '@/components/legal/legal-shell'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'hu' ? 'Süti tájékoztató' : 'Cookie Policy',
    description:
      locale === 'hu'
        ? 'Milyen sütiket használ a Terra Verde Pizzéria weboldala.'
        : 'Which cookies the Terra Verde Pizzéria website uses.',
  }
}

export default async function CookiePage({ params }: PageProps) {
  const { locale } = await params
  const isHu = locale === 'hu'

  return (
    <LegalShell
      locale={locale}
      title={isHu ? 'Süti tájékoztató' : 'Cookie Policy'}
      subtitle={isHu ? 'Hatályos: 2026. június 23.' : 'Effective: 23 June 2026'}
    >
      <p>
        {isHu
          ? 'A sütik (cookie-k) kis adatfájlok, amelyeket a böngésződ tárol. Weboldalunk a lehető legkevesebb sütit használja: csak a működéshez szükségeseket, és — kizárólag a hozzájárulásoddal — egy anonim látogatottság-mérőt. Hirdetési és nyomkövető (marketing) sütiket nem használunk.'
          : 'Cookies are small data files stored by your browser. This website uses as few cookies as possible: only those required to function and — solely with your consent — anonymous visit measurement. We do not use advertising or tracking (marketing) cookies.'}
      </p>

      <h2>{isHu ? '1. Feltétlenül szükséges sütik' : '1. Strictly necessary cookies'}</h2>
      <p>
        {isHu
          ? 'Ezek nélkül a weboldal nem működik megfelelően, ezért nem kapcsolhatók ki. Jogalapjuk a Szolgáltató jogos érdeke.'
          : 'The site cannot work properly without these, so they cannot be turned off. Their legal basis is the operator’s legitimate interest.'}
      </p>
      <ul>
        <li>
          <strong>{isHu ? 'Munkamenet és bejelentkezés' : 'Session & login'}</strong> —{' '}
          {isHu
            ? 'a Supabase által beállított hitelesítési sütik, amelyek a bejelentkezést és a biztonságos munkamenetet kezelik.'
            : 'authentication cookies set by Supabase that manage login and the secure session.'}
        </li>
        <li>
          <strong>{isHu ? 'Süti-beállítás tárolása' : 'Cookie preference'}</strong> —{' '}
          {isHu
            ? 'a böngésződben (localStorage) tárolt választásod, hogy ne kérdezzünk rá újra.'
            : 'your choice stored in your browser (localStorage) so we don’t ask again.'}
        </li>
        <li>
          <strong>{isHu ? 'Kosár tartalma' : 'Cart contents'}</strong> —{' '}
          {isHu
            ? 'a rendelésed összeállításához a böngésződben tárolt kosáradatok.'
            : 'cart data stored in your browser to assemble your order.'}
        </li>
      </ul>

      <h2>{isHu ? '2. Statisztikai sütik (hozzájárulás alapján)' : '2. Statistics (consent-based)'}</h2>
      <p>
        {isHu
          ? 'Csak akkor aktiváljuk, ha a süti-sávban a „Mindet elfogadom” lehetőséget választod. Eszköz: Vercel Web Analytics — névtelen, összesített látogatottsági adatokat mér (pl. megtekintett oldalak), és nem azonosít személy szerint. Ha a „Csak a szükségeseket” lehetőséget választod, ez nem fut.'
          : 'Activated only if you choose “Accept all” in the cookie bar. Tool: Vercel Web Analytics — measures anonymous, aggregated traffic data (e.g. page views) and does not identify you personally. If you choose “Necessary only”, this does not run.'}
      </p>

      <h2>{isHu ? '3. A hozzájárulás módosítása' : '3. Changing your choice'}</h2>
      <p>
        {isHu
          ? 'Bármikor módosíthatod a döntésed: töröld a weboldal tárolt adatait a böngésződ beállításaiban, ekkor a süti-sáv ismét megjelenik. Emellett a böngésződben általánosan is tilthatod vagy törölheted a sütiket — egyes funkciók (pl. bejelentkezés) ekkor nem feltétlenül működnek.'
          : 'You can change your decision any time: clear this site’s stored data in your browser settings and the cookie bar reappears. You can also block or delete cookies generally in your browser — some features (e.g. login) may then not work.'}
      </p>

      <p>
        {isHu ? (
          <>
            A személyes adatok kezeléséről részletesen az{' '}
            <a href={`/${locale}/adatkezeles`}>Adatkezelési tájékoztató</a> rendelkezik.
          </>
        ) : (
          <>
            For details on personal data, see the{' '}
            <a href={`/${locale}/adatkezeles`}>Privacy Policy</a>.
          </>
        )}
      </p>
    </LegalShell>
  )
}
