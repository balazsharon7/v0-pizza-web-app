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
    subject: 'Rendelésed megérkezett - Terra Verde',
    greeting: 'Kedves',
    orderConfirmed: 'Köszönjük a rendelésed!',
    orderNumber: 'Rendelés száma:',
    deliveryType: 'Átvétel módja:',
    pickup: 'Személyes átvétel',
    delivery: 'Házhozszállítás',
    items: 'Megrendelt tételek',
    subtotal: 'Részösszesen:',
    deliveryFee: 'Szállítási díj:',
    total: 'Végösszeg:',
    deliveryAddress: 'Szállítási cím:',
    phone: 'Telefonszám:',
    notes: 'Megjegyzés:',
    estimatedTime: 'Várható kiszállítási idő: kb. 60 perc',
    estimatedPickup: 'Várható elkészülés: kb. 30 perc',
    thankYou: 'Jó étvágyat kívánunk!',
    footer: 'Terra Verde Pizzéria',
  },
  en: {
    subject: 'Your order is confirmed - Terra Verde',
    greeting: 'Dear',
    orderConfirmed: 'Thank you for your order!',
    orderNumber: 'Order number:',
    deliveryType: 'Delivery type:',
    pickup: 'Pickup',
    delivery: 'Home delivery',
    items: 'Ordered items',
    subtotal: 'Subtotal:',
    deliveryFee: 'Delivery fee:',
    total: 'Total:',
    deliveryAddress: 'Delivery address:',
    phone: 'Phone:',
    notes: 'Notes:',
    estimatedTime: 'Estimated delivery time: approx. 60 minutes',
    estimatedPickup: 'Estimated pickup time: approx. 30 minutes',
    thankYou: 'Enjoy your meal!',
    footer: 'Terra Verde Pizzeria',
  },
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: 'HUF',
    maximumFractionDigits: 0,
  }).format(price)
}

function getItemDescription(item: any): string {
  // Use product_name and size_name passed directly from checkout
  let desc = `${item.quantity}x ${item.product_name || 'Termék'}`
  if (item.size_name) {
    desc += ` (${item.size_name})`
  }
  if (item.topping_names && item.topping_names.length > 0) {
    const toppings = item.topping_names.filter(Boolean).join(', ')
    if (toppings) {
      desc += ` + ${toppings}`
    }
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
      .map(item => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e8e4e0;">
            ${getItemDescription(item)}
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e8e4e0; text-align: right; font-weight: 500;">
            ${formatPrice(item.total_price)}
          </td>
        </tr>
      `)
      .join('')

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f6f3; font-family: 'Georgia', 'Times New Roman', serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f6f3;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4a7c59 0%, #5d8a6b 100%); padding: 40px; text-align: center; border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 400; color: #ffffff; font-family: 'Georgia', serif; letter-spacing: 1px;">
                Terra Verde
              </h1>
              <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.85); letter-spacing: 2px; text-transform: uppercase;">
                Pizzéria
              </p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px;">
              
              <!-- Order Confirmed -->
              <h2 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 400; color: #2d3a30; font-family: 'Georgia', serif; text-align: center;">
                ${t.orderConfirmed}
              </h2>
              
              <p style="margin: 0 0 32px 0; font-size: 16px; color: #5a6b5e; line-height: 1.6; text-align: center;">
                ${t.greeting} ${order.customer_name}!
              </p>
              
              <!-- Order Info Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f6f3; border-radius: 12px; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <span style="font-size: 13px; color: #7a8a7e; text-transform: uppercase; letter-spacing: 1px;">${t.orderNumber}</span><br>
                          <span style="font-size: 20px; font-weight: 600; color: #4a7c59;">${order.order_number}</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span style="font-size: 13px; color: #7a8a7e; text-transform: uppercase; letter-spacing: 1px;">${t.deliveryType}</span><br>
                          <span style="font-size: 16px; color: #2d3a30;">${order.delivery_type === 'pickup' ? t.pickup : t.delivery}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Items -->
              <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #7a8a7e; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #4a7c59; padding-bottom: 8px;">
                ${t.items}
              </h3>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                ${itemsHtml}
              </table>
              
              <!-- Totals -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top: 2px solid #e8e4e0; padding-top: 16px;">
                <tr>
                  <td style="padding: 8px 0; color: #5a6b5e;">${t.subtotal}</td>
                  <td style="padding: 8px 0; text-align: right; color: #2d3a30;">${formatPrice(order.subtotal)}</td>
                </tr>
                ${order.delivery_fee > 0 ? `
                <tr>
                  <td style="padding: 8px 0; color: #5a6b5e;">${t.deliveryFee}</td>
                  <td style="padding: 8px 0; text-align: right; color: #2d3a30;">${formatPrice(order.delivery_fee)}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 16px 0 8px 0; font-size: 18px; font-weight: 600; color: #2d3a30;">${t.total}</td>
                  <td style="padding: 16px 0 8px 0; text-align: right; font-size: 24px; font-weight: 700; color: #4a7c59;">${formatPrice(order.total)}</td>
                </tr>
              </table>
              
              ${order.delivery_type === 'delivery' && order.delivery_address ? `
              <!-- Delivery Address -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f6f3; border-radius: 12px; margin: 24px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <span style="font-size: 13px; color: #7a8a7e; text-transform: uppercase; letter-spacing: 1px;">${t.deliveryAddress}</span><br>
                    <span style="font-size: 16px; color: #2d3a30; line-height: 1.5;">
                      ${order.delivery_address}<br>
                      ${order.delivery_city} ${order.delivery_zip || ''}
                    </span>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Phone -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <span style="font-size: 13px; color: #7a8a7e; text-transform: uppercase; letter-spacing: 1px;">${t.phone}</span><br>
                    <span style="font-size: 16px; color: #2d3a30;">${order.customer_phone}</span>
                  </td>
                </tr>
              </table>
              
              ${order.notes ? `
              <!-- Notes -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fdf8f3; border-left: 4px solid #c17f59; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <span style="font-size: 13px; color: #7a8a7e; text-transform: uppercase; letter-spacing: 1px;">${t.notes}</span><br>
                    <span style="font-size: 15px; color: #2d3a30; font-style: italic;">${order.notes}</span>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Estimated Time -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #4a7c59; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <span style="font-size: 16px; color: #ffffff;">
                      ${order.delivery_type === 'pickup' ? t.estimatedPickup : t.estimatedTime}
                    </span>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 18px; color: #2d3a30; text-align: center; font-family: 'Georgia', serif; font-style: italic;">
                ${t.thankYou}
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #2d3a30; padding: 32px; text-align: center; border-radius: 0 0 16px 16px;">
              <p style="margin: 0 0 8px 0; font-size: 18px; color: #ffffff; font-family: 'Georgia', serif;">
                ${t.footer}
              </p>
              <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.7);">
                Budaörs | +36 30 173 5918
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `

    const response = await resend.emails.send({
      from: 'terraverde@resend.dev',
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
