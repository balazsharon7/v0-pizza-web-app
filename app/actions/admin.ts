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
  category_id?: string
}) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('products')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', productId)
  
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
  category_id: string
}) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('products')
    .insert(data)
  
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
