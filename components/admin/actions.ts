'use server'

import { createClient } from '@/lib/supabase/server'
import type { OrderStatus } from '@/lib/types'

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const updateData: Record<string, unknown> = { status }

    // Set timestamps based on status
    if (status === 'confirmed') {
      updateData.confirmed_at = new Date().toISOString()
    } else if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Update order status error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
