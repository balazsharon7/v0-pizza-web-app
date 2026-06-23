'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/lib/i18n/config'
import { getConsent, setConsent } from '@/lib/consent'

interface CookieConsentProps {
  locale: Locale
}

export function CookieConsent({ locale: locale }: CookieConsentProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (getConsent() === null) {
      // Small delay so it doesn't flash immediately on page load
      const t = setTimeout(() => setVisible(true), 1200)
      return () => clearTimeout(t)
    }
  }, [])

  const acceptAll = () => {
    setConsent({ analytics: true })
    setVisible(false)
  }

  const onlyNecessary = () => {
    setConsent({ analytics: false })
    setVisible(false)
  }

  if (!visible) return null

  const t = {
    title: locale === 'hu' ? 'Sütiket használunk' : 'We use cookies',
    description:
      locale === 'hu'
        ? 'A működéshez szükséges sütiket mindig használjuk (munkamenet, bejelentkezés). Statisztikai (látogatottság-mérő) sütiket csak az engedélyeddel.'
        : 'We always use cookies required for the site to work (session, login). Statistics (analytics) run only with your consent.',
    accept: locale === 'hu' ? 'Mindet elfogadom' : 'Accept all',
    decline: locale === 'hu' ? 'Csak a szükségeseket' : 'Necessary only',
    more: locale === 'hu' ? 'Süti tájékoztató' : 'Cookie policy',
  }

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:bottom-6 md:max-w-md animate-fade-in-up"
      role="dialog"
      aria-label={t.title}
    >
      <div className="rounded-2xl border bg-card shadow-xl p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 flex-shrink-0 mt-0.5">
            <Cookie className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold font-serif text-base">{t.title}</p>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {t.description}
            </p>
          </div>
          <button
            onClick={onlyNecessary}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={acceptAll} className="flex-1 rounded-full">
            {t.accept}
          </Button>
          <Button onClick={onlyNecessary} variant="outline" className="flex-1 rounded-full">
            {t.decline}
          </Button>
        </div>

        <Link
          href={`/${locale}/cookie`}
          className="block text-center text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          {t.more}
        </Link>
      </div>
    </div>
  )
}
