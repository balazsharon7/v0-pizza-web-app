'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateProduct(productId: string, data: {
  name_hu?: string
  name_en?: string
  description_hu?: string
  description_en?: string
  base_price?: number
  image_url?: string
  is_available?: boolean
  is_customizable?: boolean
  is_featured?: boolean
  category_id?: string
}) {
  const supabase = await createClient()

  const isMissingFeaturedColumn = (msg: string) =>
    /is_featured|featured/i.test(msg) && /column|schema cache|find/i.test(msg)

  const tryUpdate = async (payload: Record<string, unknown>) =>
    supabase
      .from('products')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', productId)

  let { error } = await tryUpdate(data)
  // If the is_featured column hasn't been migrated yet (scripts/006...) the
  // first attempt fails. Strip the flag and retry so admins can keep editing
  // products in the meantime — but only when that's the actual problem.
  if (error && data.is_featured !== undefined && isMissingFeaturedColumn(error.message)) {
    const { is_featured: _omit, ...rest } = data
    const retry = await tryUpdate(rest)
    error = retry.error
  }

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/[locale]', 'layout')
  revalidatePath('/[locale]/menu', 'page')

  return { success: true }
}

export async function createProduct(data: {
  name_hu: string
  name_en: string
  description_hu?: string
  description_en?: string
  base_price: number
  image_url?: string
  is_available?: boolean
  is_customizable?: boolean
  is_featured?: boolean
  category_id: string
}) {
  const supabase = await createClient()

  const isMissingFeaturedColumn = (msg: string) =>
    /is_featured|featured/i.test(msg) && /column|schema cache|find/i.test(msg)

  let { error } = await supabase.from('products').insert(data)
  if (error && data.is_featured !== undefined && isMissingFeaturedColumn(error.message)) {
    const { is_featured: _omit, ...rest } = data
    const retry = await supabase.from('products').insert(rest)
    error = retry.error
  }

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/[locale]', 'layout')
  revalidatePath('/[locale]/menu', 'page')

  return { success: true }
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  revalidatePath('/[locale]', 'layout')
  revalidatePath('/[locale]/menu', 'page')
  
  return { success: true }
}

export async function updateSettings(key: string, value: Record<string, unknown>) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('settings')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key)
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  revalidatePath('/[locale]', 'layout')
  
  return { success: true }
}

export async function updateCategory(categoryId: string, data: {
  name_hu?: string
  name_en?: string
  slug?: string
  is_active?: boolean
  sort_order?: number
}) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('categories')
    .update(data)
    .eq('id', categoryId)
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  revalidatePath('/[locale]', 'layout')
  revalidatePath('/[locale]/menu', 'page')
  
  return { success: true }
}

export async function revalidateAll() {
  revalidatePath('/[locale]', 'layout')
  revalidatePath('/[locale]/menu', 'page')
  return { success: true }
}
