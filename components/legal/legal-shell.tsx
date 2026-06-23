import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'

interface LegalShellProps {
  locale: Locale
  title: string
  /** Optional small text under the title, e.g. last-updated date. */
  subtitle?: string
  children: React.ReactNode
}

/**
 * Shared layout for legal / informational pages (Impresszum, ÁSZF,
 * Adatkezelési tájékoztató, Allergének). Provides a consistent header,
 * readable prose width and a "back" link. The actual legal copy lives in
 * each page so it can be reviewed and edited independently.
 */
export function LegalShell({ locale, title, subtitle, children }: LegalShellProps) {
  return (
    <main className="min-h-screen bg-background">
      <section className="border-b bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            {locale === 'hu' ? 'Vissza a főoldalra' : 'Back to home'}
          </Link>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-balance">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 lg:py-16">
        <div
          className="
            mx-auto max-w-3xl space-y-6 leading-relaxed text-foreground/90
            [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-10 [&_h2]:mb-3
            [&_h3]:font-semibold [&_h3]:text-lg [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-2
            [&_p]:text-muted-foreground
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_ul]:text-muted-foreground
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1 [&_ol]:text-muted-foreground
            [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
            [&_strong]:text-foreground
          "
        >
          {children}
        </div>
      </section>
    </main>
  )
}
