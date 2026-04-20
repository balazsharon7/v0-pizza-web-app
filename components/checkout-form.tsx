'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Truck, Store, CreditCard, Banknote } from 'lucide-react'
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
import { formatPrice, getLocalizedName, type DeliveryType, type PaymentMethod, type DeliveryZone, type DeliverySettlement } from '@/lib/types'
import { DeliveryAddressSelector } from '@/components/delivery-address-selector'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/get-dictionary'
import { placeOrder } from '@/app/[locale]/checkout/actions'
import { createClient } from '@/lib/supabase/client'

interface CheckoutFormProps {
  locale: Locale
  dictionary: Dictionary
  deliveryZones: DeliveryZone[]
  deliverySettlements: DeliverySettlement[]
}

export function CheckoutForm({ locale, dictionary, deliveryZones, deliverySettlements }: CheckoutFormProps) {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCart()
  const t = dictionary

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  
  // New address selector state
  const [selectedSettlementId, setSelectedSettlementId] = useState<string>('')
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
  const isAddressValid = deliveryType === 'pickup' || (selectedSettlementId && selectedZip && streetAddress && selectedZone)

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
          
          // Try to match profile address with a settlement
          if (profile.default_zip) {
            const matchingSettlement = deliverySettlements.find(s => 
              s.zip_codes.includes(profile.default_zip)
            )
            if (matchingSettlement) {
              setSelectedSettlementId(matchingSettlement.id)
              setSelectedZip(profile.default_zip)
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
  }, [deliverySettlements])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleZoneChange = useCallback((zone: DeliveryZone | null) => {
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

    setIsSubmitting(true)

    // Get settlement name for city
    const settlement = deliverySettlements.find(s => s.id === selectedSettlementId)

    try {
      const orderData = {
        deliveryType,
        paymentMethod,
        customerName: formData.name,
        customerPhone: formData.phone,
        customerEmail: formData.email || null,
        deliveryAddress: deliveryType === 'delivery' ? streetAddress : null,
        deliveryCity: deliveryType === 'delivery' ? settlement?.name : null,
        deliveryZip: deliveryType === 'delivery' ? selectedZip : null,
        notes: formData.notes || null,
        subtotal,
        deliveryFee: actualDeliveryFee,
        total,
        items: items.map((item) => ({
          productId: item.product.id,
          sizeId: item.size?.id || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          toppingIds: item.toppings.map((t) => t.id),
          toppingPrices: item.toppings.map((t) => t.price),
        })),
      }

      const result = await placeOrder(orderData)

      if (result.success && result.orderNumber) {
        clearCart()
        router.push(`/${locale}/order-success?order=${result.orderNumber}`)
      } else {
        throw new Error(result.error || 'Failed to place order')
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
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                  >
                    <Truck className="mb-2 h-6 w-6" />
                    {t.checkout.delivery}
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="pickup" id="pickup" className="peer sr-only" />
                  <Label
                    htmlFor="pickup"
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                  >
                    <Store className="mb-2 h-6 w-6" />
                    {t.checkout.pickup}
                  </Label>
                </div>
              </RadioGroup>
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
                <Label htmlFor="email">{t.checkout.email}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address - New Cascading Selector */}
          {deliveryType === 'delivery' && (
            <Card>
              <CardHeader>
                <CardTitle>{t.checkout.deliveryAddress}</CardTitle>
              </CardHeader>
              <CardContent>
                <DeliveryAddressSelector
                  locale={locale}
                  settlements={deliverySettlements}
                  zones={deliveryZones}
                  selectedSettlementId={selectedSettlementId}
                  selectedZip={selectedZip}
                  address={streetAddress}
                  onSettlementChange={setSelectedSettlementId}
                  onZipChange={setSelectedZip}
                  onAddressChange={setStreetAddress}
                  onZoneChange={handleZoneChange}
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
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                  >
                    <Banknote className="mb-2 h-6 w-6" />
                    {t.checkout.cash}
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="card" id="card" className="peer sr-only" />
                  <Label
                    htmlFor="card"
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
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

              {deliveryType === 'delivery' && (
                <p className="text-sm text-muted-foreground text-center">
                  {locale === 'hu' 
                    ? 'Várható kiszállítás: 1 órán belül'
                    : 'Estimated delivery: within 1 hour'}
                </p>
              )}

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
