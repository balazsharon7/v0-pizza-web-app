import Link from 'next/link'
import { Phone, Mail, MapPin } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/get-dictionary'

interface FooterProps {
  locale: Locale
  dictionary: Dictionary
}

export function Footer({ locale, dictionary }: FooterProps) {
  const t = dictionary
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-sidebar text-sidebar-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary">
                <span className="font-serif text-lg font-bold text-sidebar-primary-foreground">TV</span>
              </div>
              <span className="font-serif text-xl font-bold">Terra Verde</span>
            </Link>
            <p className="text-sm text-sidebar-foreground/80">
              {locale === 'hu'
                ? 'Autentikus olasz pizza, friss alapanyagokból.'
                : 'Authentic Italian pizza, made with fresh ingredients.'}
            </p>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-semibold">{t.footer.contact}</h3>
            <ul className="space-y-3 text-sm text-sidebar-foreground/80">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a href="tel:+3612345678" className="hover:text-sidebar-foreground">
                  +36 1 234 5678
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:info@terraverdepizza.hu" className="hover:text-sidebar-foreground">
                  info@terraverdepizza.hu
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>Budapest, Pelda utca 123.</span>
              </li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-semibold">{t.footer.openingHours}</h3>
            <ul className="space-y-1 text-sm text-sidebar-foreground/80">
              <li className="flex justify-between">
                <span>{t.days.monday} - {t.days.thursday}</span>
                <span>11:00 - 22:00</span>
              </li>
              <li className="flex justify-between">
                <span>{t.days.friday} - {t.days.saturday}</span>
                <span>11:00 - 23:00</span>
              </li>
              <li className="flex justify-between">
                <span>{t.days.sunday}</span>
                <span>12:00 - 21:00</span>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-semibold">
              {locale === 'hu' ? 'Gyors linkek' : 'Quick Links'}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={`/${locale}/menu`}
                  className="text-sidebar-foreground/80 hover:text-sidebar-foreground"
                >
                  {t.common.menu}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/auth/login`}
                  className="text-sidebar-foreground/80 hover:text-sidebar-foreground"
                >
                  {t.common.login}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-sidebar-border pt-6 text-center text-sm text-sidebar-foreground/60">
          <p>&copy; {currentYear} Terra Verde Pizza. {t.footer.rights}</p>
        </div>
      </div>
    </footer>
  )
}
