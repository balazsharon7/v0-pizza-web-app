'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Phone, Mail, MapPin } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/get-dictionary'
import { createClient } from '@/lib/supabase/client'

interface FooterProps {
  locale: Locale
  dictionary: Dictionary
}

interface StoreInfo {
  name_hu?: string
  name_en?: string
  address?: string
  phone?: string
  email?: string
}

interface OpeningHours {
  [key: string]: {
    open: string
    close: string
    closed?: boolean
  }
}

export function Footer({ locale, dictionary }: FooterProps) {
  const t = dictionary
  const currentYear = new Date().getFullYear()
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({})
  const [openingHours, setOpeningHours] = useState<OpeningHours>({})

  useEffect(() => {
    const fetchSettings = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('settings')
        .select('key, value')

      if (data) {
        const settings: Record<string, any> = {}
        data.forEach((s) => {
          settings[s.key] = s.value
        })
        setStoreInfo(settings.store_info || {})
        setOpeningHours(settings.opening_hours || {})
      }
    }
    fetchSettings()
  }, [])

  // Format opening hours for display
  const getOpeningHoursDisplay = () => {
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    const weekend = ['saturday', 'sunday']
    
    // Check if all weekdays have the same hours
    const weekdayHours = weekdays.map(d => openingHours[d])
    const allWeekdaysSame = weekdayHours.every(h => 
      h && !h.closed && h.open === weekdayHours[0]?.open && h.close === weekdayHours[0]?.close
    )
    
    const satHours = openingHours.saturday
    const sunHours = openingHours.sunday

    return { weekdayHours: weekdayHours[0], allWeekdaysSame, satHours, sunHours }
  }

  const { weekdayHours, allWeekdaysSame, satHours, sunHours } = getOpeningHoursDisplay()

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
                <a href={`tel:${storeInfo.phone || '+36301735918'}`} className="hover:text-sidebar-foreground">
                  {storeInfo.phone || '+36 30 173 5918'}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${storeInfo.email || 'info@terraverdepizza.hu'}`} className="hover:text-sidebar-foreground">
                  {storeInfo.email || 'info@terraverdepizza.hu'}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>{storeInfo.address || '2040 Budaörs, Szabadság út 23-25.'}</span>
              </li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-semibold">{t.footer.openingHours}</h3>
            <ul className="space-y-1 text-sm text-sidebar-foreground/80">
              {allWeekdaysSame && weekdayHours && !weekdayHours.closed ? (
                <li className="flex justify-between">
                  <span>{t.days.monday} - {t.days.friday}</span>
                  <span>{weekdayHours.open} - {weekdayHours.close}</span>
                </li>
              ) : (
                <li className="flex justify-between">
                  <span>{t.days.monday} - {t.days.friday}</span>
                  <span>11:00 - 22:00</span>
                </li>
              )}
              <li className="flex justify-between">
                <span>{t.days.saturday}</span>
                <span>
                  {satHours && !satHours.closed 
                    ? `${satHours.open} - ${satHours.close}`
                    : satHours?.closed 
                      ? (locale === 'hu' ? 'Zárva' : 'Closed')
                      : '11:00 - 23:00'}
                </span>
              </li>
              <li className="flex justify-between">
                <span>{t.days.sunday}</span>
                <span>
                  {sunHours && !sunHours.closed 
                    ? `${sunHours.open} - ${sunHours.close}`
                    : sunHours?.closed 
                      ? (locale === 'hu' ? 'Zárva' : 'Closed')
                      : '12:00 - 21:00'}
                </span>
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
                  href={`/${locale}/about`}
                  className="text-sidebar-foreground/80 hover:text-sidebar-foreground"
                >
                  {locale === 'hu' ? 'Rólunk' : 'About'}
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
