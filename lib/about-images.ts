/**
 * Admin-editable images on the About ("Rólunk") page.
 *
 * The public page renders `settings.about_images[slot]` when set, otherwise the
 * static default below. The admin settings form uploads to Vercel Blob and
 * stores the resulting URL under the same slot key.
 */
export type AboutImageSlot =
  | 'hero_main'
  | 'hero_inset'
  | 'gallery_fold'
  | 'gallery_pizzas'
  | 'gallery_terrace'
  | 'gallery_kitchen'

export interface AboutImageMeta {
  slot: AboutImageSlot
  default: string
  label_hu: string
  label_en: string
}

export const ABOUT_IMAGE_SLOTS: AboutImageMeta[] = [
  { slot: 'hero_main', default: '/images/pizzak.jpg', label_hu: 'Hero – fő kép', label_en: 'Hero – main photo' },
  { slot: 'hero_inset', default: '/images/pizza-room.jpg', label_hu: 'Hero – kemence inzert', label_en: 'Hero – oven inset' },
  { slot: 'gallery_fold', default: '/images/pizza-fold.jpg', label_hu: 'Galéria – Pizza al Portafoglio', label_en: 'Gallery – Pizza al Portafoglio' },
  { slot: 'gallery_pizzas', default: '/images/pizzak.jpg', label_hu: 'Galéria – Pizzáink', label_en: 'Gallery – Our pizzas' },
  { slot: 'gallery_terrace', default: '/images/terasz.jpg', label_hu: 'Galéria – Teraszunk', label_en: 'Gallery – Our terrace' },
  { slot: 'gallery_kitchen', default: '/images/pizza-room.jpg', label_hu: 'Galéria – Konyhánk', label_en: 'Gallery – Our kitchen' },
]

export type AboutImages = Partial<Record<AboutImageSlot, string>>

/** Resolve a slot to its custom URL or the static default. */
export function aboutImageSrc(images: AboutImages | undefined, slot: AboutImageSlot): string {
  const meta = ABOUT_IMAGE_SLOTS.find((s) => s.slot === slot)!
  const custom = images?.[slot]
  return custom && custom.trim() ? custom : meta.default
}
