import type { Locale } from './i18n/config'

export interface Category {
  id: string
  name_hu: string
  name_en: string
  slug: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface Product {
  id: string
  category_id: string
  name_hu: string
  name_en: string
  description_hu: string | null
  description_en: string | null
  base_price: number
  image_url: string | null
  is_available: boolean
  is_customizable: boolean
  is_featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
  category?: Category
}

export interface Size {
  id: string
  name_hu: string
  name_en: string
  size_cm: number | null
  price_multiplier: number
  sort_order: number
  is_active: boolean
}

export interface Topping {
  id: string
  name_hu: string
  name_en: string
  price: number
  is_available: boolean
  sort_order: number
}

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  default_address: string | null
  default_city: string | null
  default_zip: string | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'completed' | 'cancelled'
export type DeliveryType = 'delivery' | 'pickup'
export type PaymentMethod = 'cash' | 'card'

export interface Order {
  id: string
  user_id: string | null
  order_number: string
  status: OrderStatus
  delivery_type: DeliveryType
  customer_name: string
  customer_phone: string
  customer_email: string | null
  delivery_address: string | null
  delivery_city: string | null
  delivery_zip: string | null
  subtotal: number
  delivery_fee: number
  total: number
  payment_method: PaymentMethod
  notes: string | null
  created_at: string
  confirmed_at: string | null
  completed_at: string | null
  estimated_delivery: string | null
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  size_id: string | null
  quantity: number
  unit_price: number
  total_price: number
  notes: string | null
  created_at: string
  product?: Product
  size?: Size
  toppings?: OrderItemTopping[]
}

export interface OrderItemTopping {
  id: string
  order_item_id: string
  topping_id: string
  price: number
  topping?: Topping
}

export interface StoreInfo {
  name_hu: string
  name_en: string
  address: string
  phone: string
  email: string
}

export interface OpeningHours {
  [key: string]: {
    open: string
    close: string
  }
}

export interface DeliverySettings {
  min_order: number
  fee: number
  free_above: number
  radius_km: number
  estimated_time_min: number
  estimated_time_max: number
}

export interface DeliveryZone {
  id: string
  name_hu: string
  name_en: string
  color: string
  min_order: number
  delivery_fee: number
  delivery_time_min: number
  delivery_time_max: number
  polygon: [number, number][]
  zip_codes: string[]
  sort_order: number
  is_active: boolean
  created_at: string
}



// Cart types
export interface CartItem {
  id: string
  product: Product
  size: Size | null
  toppings: Topping[]
  quantity: number
  unitPrice: number
  totalPrice: number
  notes?: string
}

// Helper function for localized names
export function getLocalizedName<T extends { name_hu: string; name_en: string }>(
  item: T,
  locale: Locale
): string {
  return locale === 'hu' ? item.name_hu : item.name_en
}

export function getLocalizedDescription<T extends { description_hu: string | null; description_en: string | null }>(
  item: T,
  locale: Locale
): string | null {
  return locale === 'hu' ? item.description_hu : item.description_en
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('hu-HU').format(price)
}
