'use server'

import { createClient } from '@/lib/supabase/server'
import { sendOrderConfirmationEmail } from '@/lib/email'
import { isStoreOpenNow } from '@/lib/store-open'
import type { DeliveryType, PaymentMethod } from '@/lib/types'

interface OrderItemData {
  productId: string
  productName: string
  sizeId: string | null
  sizeName: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
  toppingIds: string[]
  toppingNames: string[]
  toppingPrices: number[]
}

interface OrderData {
  deliveryType: DeliveryType
  paymentMethod: PaymentMethod
  customerName: string
  customerPhone: string
  customerEmail: string
  deliveryAddress: string | null
  deliveryCity: string | null
  deliveryZip: string | null
  notes: string | null
  subtotal: number
  deliveryFee: number
  total: number
  deliveryTimeMin: number | null
  deliveryTimeMax: number | null
  scheduledFor: string | null
  items: OrderItemData[]
}

function generateOrderNumber(): string {
  // Simple 6-digit order number: TV-123456
  const num = Math.floor(100000 + Math.random() * 900000)
  return `TV-${num}`
}

export async function placeOrder(data: OrderData): Promise<{ success: boolean; orderNumber?: string; error?: string }> {
  try {
    // Reject ASAP orders while the restaurant is closed. Scheduled orders are
    // allowed (their time is validated against opening hours at checkout).
    if (!data.scheduledFor && !(await isStoreOpenNow())) {
      return {
        success: false,
        error:
          'Az étterem jelenleg zárva van, ezért azonnali rendelést nem tudunk fogadni. Adj le időzített rendelést, vagy próbáld újra nyitvatartási időben.',
      }
    }

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
        delivery_time_min: data.deliveryTimeMin,
        delivery_time_max: data.deliveryTimeMax,
        scheduled_for: data.scheduledFor,
      })

    if (orderError) {
      console.error('Order creation error:', orderError)
      return { success: false, error: `Order creation failed: ${orderError.message}` }
    }

    // Create order items
    const orderItems = []
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

      orderItems.push({
        id: orderItemId,
        order_id: orderId,
        product_id: item.productId,
        product_name: item.productName,
        size_id: item.sizeId,
        size_name: item.sizeName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        topping_names: item.toppingNames,
      } as any)

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

    // Send confirmation email
    const order = {
      id: orderId,
      order_number: orderNumber,
      status: 'pending' as const,
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
      user_id: user?.id || null,
      created_at: new Date().toISOString(),
      confirmed_at: null,
      completed_at: null,
      estimated_delivery: null,
      delivery_time_min: data.deliveryTimeMin,
      delivery_time_max: data.deliveryTimeMax,
      scheduled_for: data.scheduledFor,
    }
    
    const emailSent = await sendOrderConfirmationEmail({
      order: order as any,
      items: orderItems as any,
      locale: 'hu',
    })

    if (!emailSent) {
      console.warn('Failed to send confirmation email')
      // Don't fail the order if email fails
    }

    return { success: true, orderNumber }
  } catch (error) {
    console.error('Place order error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
