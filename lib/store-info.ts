import { createClient } from '@/lib/supabase/server'

export interface StoreInfoData {
  name: string
  address: string
  phone: string
  email: string
}

const FALLBACK: StoreInfoData = {
  name: 'Terra Verde Pizzéria',
  address: '2040 Budaörs, Szabadság út 23-25.',
  phone: '+36 30 173 5918',
  email: 'info@terraverdepizza.hu',
}

/**
 * Loads the publicly displayable store contact details from the `settings`
 * table (key `store_info`), falling back to sensible defaults. Used by the
 * legal/info pages so the contact data stays in sync with the admin settings.
 */
export async function getStoreInfo(): Promise<StoreInfoData> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'store_info')
      .maybeSingle()

    const info = (data?.value ?? {}) as Record<string, string | undefined>
    return {
      name: info.name_hu || info.name_en || FALLBACK.name,
      address: info.address || FALLBACK.address,
      phone: info.phone || FALLBACK.phone,
      email: info.email || FALLBACK.email,
    }
  } catch {
    return FALLBACK
  }
}
