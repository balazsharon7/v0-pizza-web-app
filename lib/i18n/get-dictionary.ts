import type { Locale } from './config'
import { locales, defaultLocale } from './config'

const dictionaries: Record<Locale, () => Promise<Record<string, unknown>>> = {
  hu: () => import('./dictionaries/hu.json').then((module) => module.default),
  en: () => import('./dictionaries/en.json').then((module) => module.default),
}

export const getDictionary = async (locale: Locale | string) => {
  // Validate locale and fallback to default if invalid
  const validLocale = (locale in dictionaries) ? locale as Locale : defaultLocale
  return dictionaries[validLocale]()
}

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>
