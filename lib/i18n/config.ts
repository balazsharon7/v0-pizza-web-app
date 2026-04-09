export const locales = ['hu', 'en'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'hu'

export const localeNames: Record<Locale, string> = {
  hu: 'Magyar',
  en: 'English',
}
