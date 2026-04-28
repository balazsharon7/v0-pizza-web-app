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
    
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
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
      .select()
      .single()

    if (orderError) {
      console.error('[v0] Order creation error:', JSON.stringify(orderError, null, 2))
      console.error('[v0] User ID:', user?.id || 'anonymous')
      console.error('[v0] Order data:', JSON.stringify({
        user_id: user?.id || null,
        order_number: orderNumber,
        delivery_type: data.deliveryType,
        customer_name: data.customerName,
      }, null, 2))
      return { success: false, error: `Order creation failed: ${orderError.message}` }
    }

    // Create order items
    for (const item of data.items) {
      const { data: orderItem, error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: item.productId,
          size_id: item.sizeId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
        })
        .select()
        .single()

      if (itemError) {
        console.error('Order item creation error:', itemError)
        throw new Error('Failed to create order item')
      }

      // Create order item toppings
      if (item.toppingIds.length > 0) {
        const toppingInserts = item.toppingIds.map((toppingId, index) => ({
          order_item_id: orderItem.id,
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
