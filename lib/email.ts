import { Resend } from 'resend'
import type { Order, OrderItem } from '@/lib/types'

// Only initialize Resend if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

interface OrderEmailData {
  order: Order
  items: OrderItem[]
  locale: 'hu' | 'en'
}

const translations = {
  hu: {
    subject: 'Rendelése leadva - Pizza Világ',
    greeting: 'Kedves',
    orderConfirmed: 'Rendelése sikeresen leadva!',
    orderNumber: 'Rendelés száma:',
    deliveryType: 'Szállítás típusa:',
    pickup: 'Személyes átvétel',
    delivery: 'Házhozszállítás',
    items: 'Megrendelt termékek:',
    subtotal: 'Részösszesen:',
    deliveryFee: 'Szállítási díj:',
    total: 'Összesen:',
    deliveryAddress: 'Szállítási cím:',
    phone: 'Telefonszám:',
    notes: 'Megjegyzések:',
    estimatedTime: 'Becsült szállítási idő: 30-45 perc',
    thankYou: 'Köszönjük a rendelést!',
  },
  en: {
    subject: 'Your Order Confirmed - Pizza World',
    greeting: 'Hello',
    orderConfirmed: 'Your order has been placed successfully!',
    orderNumber: 'Order number:',
    deliveryType: 'Delivery type:',
    pickup: 'Pickup',
    delivery: 'Home delivery',
    items: 'Ordered items:',
    subtotal: 'Subtotal:',
    deliveryFee: 'Delivery fee:',
    total: 'Total:',
    deliveryAddress: 'Delivery address:',
    phone: 'Phone:',
    notes: 'Notes:',
    estimatedTime: 'Estimated delivery time: 30-45 minutes',
    thankYou: 'Thank you for your order!',
  },
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: 'HUF',
  }).format(price)
}

function getItemDescription(item: OrderItem): string {
  let desc = `${item.quantity}x ${item.product?.name_hu || 'Termék'}`
  if (item.size) {
    desc += ` (${item.size.name_hu})`
  }
  if (item.toppings && item.toppings.length > 0) {
    const toppingNames = item.toppings.map(t => t.topping?.name_hu || 'Topping').join(', ')
    desc += ` + ${toppingNames}`
  }
  return desc
}

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  // Skip if Resend is not configured
  if (!resend) {
    console.warn('[v0] Resend API key not configured, skipping email')
    return false
  }

  try {
    const t = translations[data.locale]
    const order = data.order
    const items = data.items

    const itemsHtml = items
      .map(item => `<li>${getItemDescription(item)} - ${formatPrice(item.total_price)}</li>`)
      .join('')

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; padding: 20px; text-align: center; border-radius: 5px; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .order-details { background: white; padding: 15px; border-left: 4px solid #ff6b35; margin: 15px 0; }
    .items-list { list-style: none; padding: 0; }
    .items-list li { padding: 8px 0; border-bottom: 1px solid #eee; }
    .items-list li:last-child { border-bottom: none; }
    .totals { margin-top: 20px; padding-top: 15px; border-top: 2px solid #ff6b35; }
    .total-row { display: flex; justify-content: space-between; margin: 8px 0; }
    .total-final { font-weight: bold; font-size: 18px; color: #ff6b35; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍕 Pizza Világ</h1>
      <h2>${t.orderConfirmed}</h2>
    </div>

    <div class="content">
      <p>${t.greeting} ${order.customer_name}!</p>

      <div class="order-details">
        <strong>${t.orderNumber}</strong> ${order.order_number}<br>
        <strong>${t.deliveryType}</strong> ${order.delivery_type === 'pickup' ? t.pickup : t.delivery}
      </div>

      <h3>${t.items}</h3>
      <ul class="items-list">
        ${itemsHtml}
      </ul>

      <div class="totals">
        <div class="total-row">
          <span>${t.subtotal}</span>
          <strong>${formatPrice(order.subtotal)}</strong>
        </div>
        ${order.delivery_fee > 0 ? `
        <div class="total-row">
          <span>${t.deliveryFee}</span>
          <strong>${formatPrice(order.delivery_fee)}</strong>
        </div>
        ` : ''}
        <div class="total-row total-final">
          <span>${t.total}</span>
          <strong>${formatPrice(order.total)}</strong>
        </div>
      </div>

      ${order.delivery_type === 'delivery' && order.delivery_address ? `
      <div class="order-details">
        <strong>${t.deliveryAddress}</strong><br>
        ${order.delivery_address}<br>
        ${order.delivery_city} ${order.delivery_zip}
      </div>
      ` : ''}

      <div class="order-details">
        <strong>${t.phone}</strong> ${order.customer_phone}
      </div>

      ${order.notes ? `
      <div class="order-details">
        <strong>${t.notes}</strong><br>
        ${order.notes}
      </div>
      ` : ''}

      <p><em>${t.estimatedTime}</em></p>
      <p><strong>${t.thankYou}</strong></p>
    </div>

    <div class="footer">
      <p>Pizza Világ | Cím: Szeged | Tel: +36 1 234 5678</p>
    </div>
  </div>
</body>
</html>
    `

    const response = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: order.customer_email,
      subject: t.subject,
      html,
    })

    if (response.error) {
      console.error('Email sending error:', response.error)
      return false
    }

    console.log('[v0] Order confirmation email sent:', response.data?.id)
    return true
  } catch (error) {
    console.error('Send order confirmation email error:', error)
    return false
  }
}
