'use server'

import { createClient } from '@/lib/supabase/server'
import type { DeliveryType, PaymentMethod } from '@/lib/types'

interface OrderItemData {
  productId: string
  sizeId: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
  toppingIds: string[]
  toppingPrices: number[]
}

interface OrderData {
  deliveryType: DeliveryType
  paymentMethod: PaymentMethod
  customerName: string
  customerPhone: string
  customerEmail: string | null
  deliveryAddress: string | null
  deliveryCity: string | null
  deliveryZip: string | null
  notes: string | null
  subtotal: number
  deliveryFee: number
  total: number
  items: OrderItemData[]
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `TV-${timestamp}-${random}`
}

export async function placeOrder(data: OrderData): Promise<{ success: boolean; orderNumber?: string; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Get current user if logged in
    const { data: { user } } = await supabase.auth.getUser()
    
    const orderNumber = generateOrderNumber()
    
    // Generate a UUID for the order
    const orderId = crypto.randomUUID()
    
    // Create order - don't use .select() for anonymous users as they can't read back
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        user_id: user?.id || null,
        order_number: orderNumber,
        status: 'pending',
        delivery_type: data.deliveryType,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        customer_email: data.customerEmail,
        delivery_address: data.deliveryAddress,
        delivery_city: data.deliveryCity,
        delivery_zip: data.deliveryZip,
        subtotal: data.subtotal,
        delivery_fee: data.deliveryFee,
        total: data.total,
        payment_method: data.paymentMethod,
        notes: data.notes,
      })

    if (orderError) {
      console.error('Order creation error:', orderError)
      return { success: false, error: `Order creation failed: ${orderError.message}` }
    }

    // Create order items
    for (const item of data.items) {
      const orderItemId = crypto.randomUUID()
      
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          id: orderItemId,
          order_id: orderId,
          product_id: item.productId,
          size_id: item.sizeId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
        })

      if (itemError) {
        console.error('Order item creation error:', itemError)
        return { success: false, error: `Order item creation failed: ${itemError.message}` }
      }

      // Create order item toppings
      if (item.toppingIds.length > 0) {
        const toppingInserts = item.toppingIds.map((toppingId, index) => ({
          order_item_id: orderItemId,
          topping_id: toppingId,
          price: item.toppingPrices[index],
        }))

        const { error: toppingsError } = await supabase
          .from('order_item_toppings')
          .insert(toppingInserts)

        if (toppingsError) {
          console.error('Order toppings creation error:', toppingsError)
          // Non-critical, don't throw
        }
      }
    }

    return { success: true, orderNumber }
  } catch (error) {
    console.error('Place order error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
