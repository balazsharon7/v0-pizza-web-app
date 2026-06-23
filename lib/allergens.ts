import {
  Wheat,
  Shell,
  Egg,
  Fish,
  Nut,
  Bean,
  Milk,
  Leaf,
  Droplet,
  Sprout,
  Wine,
  Flower2,
  type LucideIcon,
} from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'

export interface AllergenDef {
  /** Stable code stored in products.allergens (text[]). */
  code: string
  hu: string
  en: string
  icon: LucideIcon
}

/**
 * The 14 allergens that must be declared under EU Regulation 1169/2011.
 * Codes are stable identifiers persisted in the database; labels and icons
 * are presentation-only. The full legal descriptions live on the
 * /[locale]/allergenek page.
 */
export const ALLERGENS: AllergenDef[] = [
  { code: 'gluten', hu: 'Glutén', en: 'Gluten', icon: Wheat },
  { code: 'crustaceans', hu: 'Rákfélék', en: 'Crustaceans', icon: Shell },
  { code: 'eggs', hu: 'Tojás', en: 'Egg', icon: Egg },
  { code: 'fish', hu: 'Hal', en: 'Fish', icon: Fish },
  { code: 'peanuts', hu: 'Földimogyoró', en: 'Peanuts', icon: Nut },
  { code: 'soy', hu: 'Szója', en: 'Soy', icon: Bean },
  { code: 'milk', hu: 'Tej', en: 'Milk', icon: Milk },
  { code: 'nuts', hu: 'Diófélék', en: 'Tree nuts', icon: Nut },
  { code: 'celery', hu: 'Zeller', en: 'Celery', icon: Leaf },
  { code: 'mustard', hu: 'Mustár', en: 'Mustard', icon: Droplet },
  { code: 'sesame', hu: 'Szezámmag', en: 'Sesame', icon: Sprout },
  { code: 'sulphites', hu: 'Szulfitok', en: 'Sulphites', icon: Wine },
  { code: 'lupin', hu: 'Csillagfürt', en: 'Lupin', icon: Flower2 },
  { code: 'molluscs', hu: 'Puhatestűek', en: 'Molluscs', icon: Shell },
]

export const ALLERGENS_BY_CODE: Record<string, AllergenDef> = Object.fromEntries(
  ALLERGENS.map((a) => [a.code, a]),
)

export function allergenLabel(code: string, locale: Locale): string {
  const a = ALLERGENS_BY_CODE[code]
  return a ? (locale === 'hu' ? a.hu : a.en) : code
}
