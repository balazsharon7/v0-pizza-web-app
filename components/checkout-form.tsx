'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Truck, Store, CreditCard, Banknote, Zap, CalendarClock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { useCart } from '@/lib/cart-context'
import { formatPrice, getLocalizedName, type DeliveryType, type PaymentMethod, type DeliveryZone } from '@/lib/types'
import { DeliveryAddressSelector } from '@/components/delivery-address-selector'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/get-dictionary'
import { placeOrder } from '@/app/[locale]/checkout/actions'
import { createClient } from '@/lib/supabase/client'

interface OpeningHours {
  [day: string]: { open?: string; close?: string; closed?: boolean }
}

interface CheckoutFormProps {
  locale: Locale
  dictionary: Dictionary
  deliveryZones: DeliveryZone[]
  openingHours?: OpeningHours
}

// Uniform sizing for all the radio "option" rectangles (delivery type,
// timing, payment method) so they line up consistently in the design.
const optionBox =
  'flex h-full min-h-[88px] flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 text-center text-sm hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer'

// Pickup preparation time (minutes) shown when there's no delivery zone.
const PICKUP_MIN = 20
const PICKUP_MAX = 30
// Minimum lead time for a scheduled order (minutes).
const SCHEDULE_LEAD_MIN = 45

const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

function pad(n: number) {
  return String(n).padStart(2, '0')
}
function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function CheckoutForm({ locale, dictionary, deliveryZones, openingHours = {} }: CheckoutFormProps) {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCart()
  const t = dictionary

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [scheduleMode, setScheduleMode] = useState<'asap' | 'scheduled'>('asap')
  const [scheduledFor, setScheduledFor] = useState<string>('')
  
  // Address selector state - now directly using zones
  const [selectedZoneId, setSelectedZoneId] = useState<string>('')
  const [selectedZip, setSelectedZip] = useState<string>('')
  const [streetAddress, setStreetAddress] = useState<string>('')
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  })

  // Calculate fees based on selected zone
  const deliveryFee = selectedZone?.delivery_fee || 0
  const minOrder = selectedZone?.min_order || 0
  const isMinOrderMet = subtotal >= minOrder
  const actualDeliveryFee = deliveryType === 'pickup' ? 0 : deliveryFee
  const total = subtotal + actualDeliveryFee
  const isAddressValid = deliveryType === 'pickup' || (selectedZoneId && selectedZip && streetAddress && selectedZone)

  // Estimated time range stored on the order: the delivery zone's time for
  // delivery, a fixed prep window for pickup.
  const estMin = deliveryType === 'pickup' ? PICKUP_MIN : selectedZone?.delivery_time_min ?? null
  const estMax = deliveryType === 'pickup' ? PICKUP_MAX : selectedZone?.delivery_time_max ?? null

  // Scheduled-order bounds (datetime-local, local time)
  const minScheduled = toLocalInput(new Date(Date.now() + SCHEDULE_LEAD_MIN * 60000))
  const maxScheduled = toLocalInput(new Date(Date.now() + 7 * 24 * 60 * 60000))

  function validateScheduled(): string | null {
    if (scheduleMode !== 'scheduled') return null
    if (!scheduledFor)
      return locale === 'hu' ? 'Válassz időpontot az időzített rendeléshez.' : 'Pick a time for the scheduled order.'
    const when = new Date(scheduledFor)
    if (isNaN(when.getTime())) return locale === 'hu' ? 'Érvénytelen időpont.' : 'Invalid time.'
    if (when.getTime() < Date.now() + SCHEDULE_LEAD_MIN * 60000 - 60000)
      return locale === 'hu'
        ? `Legalább ${SCHEDULE_LEAD_MIN} perccel későbbi időpontot válassz.`
        : `Pick a time at least ${SCHEDULE_LEAD_MIN} minutes from now.`
    const hours = openingHours[dayKeys[when.getDay()]]
    if (!hours || hours.closed || !hours.open || !hours.close)
      return locale === 'hu'
        ? 'Ezen a napon zárva tartunk, válassz másik időpontot.'
        : 'We are closed that day, pick another time.'
    const minutes = when.getHours() * 60 + when.getMinutes()
    const [oh, om] = hours.open.split(':').map(Number)
    const [ch, cm] = hours.close.split(':').map(Number)
    if (minutes < oh * 60 + om || minutes > ch * 60 + cm)
      return locale === 'hu'
        ? `Csak nyitvatartási időben (${hours.open}–${hours.close}) választható időpont.`
        : `Choose a time within opening hours (${hours.open}–${hours.close}).`
    return null
  }

  // Load profile data if user is logged in
  useEffect(() => {
    const loadProfileData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setFormData(prev => ({
            ...prev,
            name: profile.full_name || prev.name,
            phone: profile.phone || prev.phone,
            email: user.email || prev.email,
          }))
          
          // Try to match profile ZIP with a zone
          if (profile.default_zip) {
            const matchingZone = deliveryZones.find(z => 
              z.zip_codes && z.zip_codes.includes(profile.default_zip)
            )
            if (matchingZone) {
              setSelectedZoneId(matchingZone.id)
              setSelectedZip(profile.default_zip)
              setSelectedZone(matchingZone)
              if (profile.default_address) {
                setStreetAddress(profile.default_address)
              }
            }
          }
        } else {
          setFormData(prev => ({
            ...prev,
            email: user.email || prev.email,
          }))
        }
      }
    }
    
    loadProfileData()
  }, [deliveryZones])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectedZoneUpdate = useCallback((zone: DeliveryZone | null) => {
    setSelectedZone(zone)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (items.length === 0) {
      toast.error(locale === 'hu' ? 'A kosár üres' : 'Cart is empty')
      return
    }

    if (deliveryType === 'delivery') {
      if (!selectedZone) {
        toast.error(locale === 'hu' ? 'Kérjük válassz érvényes szállítási címet' : 'Please select a valid delivery address')
        return
      }
      
      if (!isMinOrderMet) {
        toast.error(
          locale === 'hu'
            ? `A minimum rendelési összeg ${formatPrice(minOrder)} Ft erre a területre`
            : `Minimum order is ${formatPrice(minOrder)} Ft for this area`
        )
        return
      }
    }

    const scheduleError = validateScheduled()
    if (scheduleError) {
      toast.error(scheduleError)
      return
    }

    setIsSubmitting(true)

    try {
      const orderData = {
        deliveryType,
        paymentMethod,
        customerName: formData.name,
        customerPhone: formData.phone,
        customerEmail: formData.email,
        deliveryAddress: deliveryType === 'delivery' ? streetAddress : null,
        deliveryCity: deliveryType === 'delivery' && selectedZone ? (locale === 'hu' ? selectedZone.name_hu : selectedZone.name_en) : null,
        deliveryZip: deliveryType === 'delivery' ? selectedZip : null,
        notes: formData.notes || null,
        subtotal,
        deliveryFee: actualDeliveryFee,
        total,
        deliveryTimeMin: estMin,
        deliveryTimeMax: estMax,
        scheduledFor: scheduleMode === 'scheduled' && scheduledFor ? new Date(scheduledFor).toISOString() : null,
        items: items.map((item) => ({
          productId: item.product.id,
          productName: getLocalizedName(item.product, locale),
          sizeId: item.size?.id || null,
          sizeName: item.size ? getLocalizedName(item.size, locale) : null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          toppingIds: item.toppings.map((t) => t.id),
          toppingNames: item.toppings.map((t) => getLocalizedName(t, locale)),
          toppingPrices: item.toppings.map((t) => t.price),
        })),
      }

      const result = await placeOrder(orderData)

      if (result.success && result.orderNumber) {
        clearCart()
        router.push(`/${locale}/order-success?order=${result.orderNumber}`)
      } else {
        toast.error(result.error || (locale === 'hu' ? 'Hiba történt a rendelés során' : 'Error placing order'))
      }
    } catch (error) {
      console.error('Order error:', error)
      toast.error(locale === 'hu' ? 'Hiba történt a rendelés során' : 'Error placing order')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">{t.cart.empty}</p>
          <Button
            className="mt-4"
            onClick={() => router.push(`/${locale}/menu`)}
          >
            {t.nav.viewMenu}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Form */}
        <div className="space-y-6">
          {/* Delivery Type */}
          <Card>
            <CardHeader>
              <CardTitle>{t.checkout.deliveryType}</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={deliveryType}
                onValueChange={(v) => setDeliveryType(v as DeliveryType)}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="delivery" id="delivery" className="peer sr-only" />
                  <Label
                    htmlFor="delivery"
                    className={optionBox}
                  >
                    <Truck className="mb-2 h-6 w-6" />
                    {t.checkout.delivery}
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="pickup" id="pickup" className="peer sr-only" />
                  <Label
                    htmlFor="pickup"
                    className={optionBox}
                  >
                    <Store className="mb-2 h-6 w-6" />
                    {t.checkout.pickup}
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* When — ASAP or scheduled */}
          <Card>
            <CardHeader>
              <CardTitle>{locale === 'hu' ? 'Mikorra kéred?' : 'When?'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={scheduleMode}
                onValueChange={(v) => setScheduleMode(v as 'asap' | 'scheduled')}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="asap" id="asap" className="peer sr-only" />
                  <Label htmlFor="asap" className={optionBox}>
                    <Zap className="mb-2 h-6 w-6" />
                    {locale === 'hu' ? 'Leghamarabb' : 'As soon as possible'}
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="scheduled" id="scheduled" className="peer sr-only" />
                  <Label htmlFor="scheduled" className={optionBox}>
                    <CalendarClock className="mb-2 h-6 w-6" />
                    {locale === 'hu' ? 'Időzített' : 'Scheduled'}
                  </Label>
                </div>
              </RadioGroup>

              {scheduleMode === 'scheduled' && (
                <div className="space-y-2">
                  <Label htmlFor="scheduledFor">{locale === 'hu' ? 'Időpont' : 'Time'}</Label>
                  <Input
                    id="scheduledFor"
                    type="datetime-local"
                    value={scheduledFor}
                    min={minScheduled}
                    max={maxScheduled}
                    onChange={(e) => setScheduledFor(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {locale === 'hu'
                      ? `Legalább ${SCHEDULE_LEAD_MIN} perccel későbbi, nyitvatartási időn belüli időpont.`
                      : `At least ${SCHEDULE_LEAD_MIN} minutes from now, within opening hours.`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t.checkout.contactInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t.checkout.name} *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t.checkout.phone} *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t.checkout.email} *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address - Using zones directly */}
          {deliveryType === 'delivery' && (
            <Card>
              <CardHeader>
                <CardTitle>{t.checkout.deliveryAddress}</CardTitle>
              </CardHeader>
              <CardContent>
                <DeliveryAddressSelector
                  locale={locale}
                  zones={deliveryZones}
                  selectedZoneId={selectedZoneId}
                  selectedZip={selectedZip}
                  address={streetAddress}
                  onZoneChange={setSelectedZoneId}
                  onZipChange={setSelectedZip}
                  onAddressChange={setStreetAddress}
                  onSelectedZoneUpdate={handleSelectedZoneUpdate}
                />
              </CardContent>
            </Card>
          )}

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>{t.checkout.paymentMethod}</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="cash" id="cash" className="peer sr-only" />
                  <Label
                    htmlFor="cash"
                    className={optionBox}
                  >
                    <Banknote className="mb-2 h-6 w-6" />
                    {t.checkout.cash}
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="card" id="card" className="peer sr-only" />
                  <Label
                    htmlFor="card"
                    className={optionBox}
                  >
                    <CreditCard className="mb-2 h-6 w-6" />
                    {t.checkout.card}
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>{t.checkout.notes}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder={t.checkout.notesPlaceholder}
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>{t.cart.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <span className="font-medium">
                        {item.quantity}x {getLocalizedName(item.product, locale)}
                      </span>
                      {item.size && (
                        <span className="text-muted-foreground">
                          {' '}({getLocalizedName(item.size, locale)})
                        </span>
                      )}
                      {item.toppings.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          + {item.toppings.map((t) => getLocalizedName(t, locale)).join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="font-medium">
                      {formatPrice(item.totalPrice)} {t.common.currency}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t.cart.subtotal}</span>
                  <span>{formatPrice(subtotal)} {t.common.currency}</span>
                </div>
                {deliveryType === 'delivery' && (
                  <div className="flex justify-between">
                    <span>{t.cart.deliveryFee}</span>
                    <span className={deliveryFee === 0 ? 'text-green-600' : ''}>
                      {!selectedZone 
                        ? (locale === 'hu' ? 'Válassz címet' : 'Select address')
                        : deliveryFee === 0 
                          ? t.cart.freeDelivery 
                          : `${formatPrice(deliveryFee)} ${t.common.currency}`}
                    </span>
                  </div>
                )}
                {deliveryType === 'delivery' && selectedZone && !isMinOrderMet && (
                  <p className="text-destructive text-xs">
                    {locale === 'hu' 
                      ? `Még ${formatPrice(minOrder - subtotal)} Ft hiányzik a minimum rendeléshez!`
                      : `${formatPrice(minOrder - subtotal)} Ft more needed for minimum order!`}
                  </p>
                )}
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>{t.cart.total}</span>
                <span className="text-primary">{formatPrice(total)} {t.common.currency}</span>
              </div>

              {scheduleMode === 'scheduled' && scheduledFor ? (
                <p className="text-sm text-muted-foreground text-center">
                  {locale === 'hu' ? 'Időzítve: ' : 'Scheduled for: '}
                  {new Date(scheduledFor).toLocaleString(locale === 'hu' ? 'hu-HU' : 'en-GB', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              ) : estMin && estMax ? (
                <p className="text-sm text-muted-foreground text-center">
                  {deliveryType === 'pickup'
                    ? locale === 'hu'
                      ? `Átvételre kész kb. ${estMin}–${estMax} perc múlva`
                      : `Ready for pickup in ~${estMin}–${estMax} min`
                    : locale === 'hu'
                      ? `Várható kiszállítás: ${estMin}–${estMax} perc`
                      : `Estimated delivery: ${estMin}–${estMax} min`}
                </p>
              ) : deliveryType === 'delivery' ? (
                <p className="text-sm text-muted-foreground text-center">
                  {locale === 'hu' ? 'Várható kiszállítás: 1 órán belül' : 'Estimated delivery: within 1 hour'}
                </p>
              ) : null}

              <Button 
                type="submit" 
                className="w-full" 
                size="lg" 
                disabled={isSubmitting || (deliveryType === 'delivery' && (!isAddressValid || !isMinOrderMet))}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2" />
                    {t.checkout.processing}
                  </>
                ) : (
                  t.checkout.placeOrder
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}
