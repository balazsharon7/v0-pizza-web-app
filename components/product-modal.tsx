'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Minus, Plus, Pizza, Info } from 'lucide-react'
import { toast } from 'sonner'
import { ALLERGENS_BY_CODE } from '@/lib/allergens'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/lib/cart-context'
import {
  formatPrice,
  getLocalizedName,
  getLocalizedDescription,
  type Product,
  type Size,
  type Topping,
} from '@/lib/types'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/get-dictionary'

interface ProductModalProps {
  product: Product | null
  sizes: Size[]
  toppings: Topping[]
  locale: Locale
  dictionary: Dictionary
  onClose: () => void
  isStoreOpen?: boolean
}

export function ProductModal({
  product,
  sizes,
  toppings,
  locale,
  dictionary,
  onClose,
  isStoreOpen = true,
}: ProductModalProps) {
  const { addItem, toggleCart } = useCart()
  const t = dictionary

  const [selectedSize, setSelectedSize] = useState<Size | null>(null)
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([])
  const [quantity, setQuantity] = useState(1)

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setSelectedSize(null)
      setSelectedToppings([])
      setQuantity(1)
    }
  }, [product])

  if (!product) return null

  const basePrice = product.base_price
  const sizeMultiplier = selectedSize?.price_multiplier ?? 1
  const toppingsPrice = selectedToppings.reduce((sum, t) => sum + t.price, 0)
  const unitPrice = Math.round(basePrice * sizeMultiplier) + toppingsPrice
  const totalPrice = unitPrice * quantity

  const handleToppingToggle = (topping: Topping) => {
    setSelectedToppings((prev) =>
      prev.some((t) => t.id === topping.id)
        ? prev.filter((t) => t.id !== topping.id)
        : [...prev, topping]
    )
  }

  const handleAddToCart = () => {
    addItem(product, selectedSize, selectedToppings, quantity)
    toast.success(t.cart.itemAdded, {
      description: getLocalizedName(product, locale),
    })
    onClose()
    toggleCart(true)
  }

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {getLocalizedName(product, locale)}
          </DialogTitle>
          <DialogDescription>
            {getLocalizedDescription(product, locale) || (locale === 'hu' ? 'Válaszd ki a feltéteket és a mennyiséget' : 'Select toppings and quantity')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Image */}
          <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center relative overflow-hidden">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={getLocalizedName(product, locale)}
                fill
                className="object-cover"
              />
            ) : (
              <Pizza className="h-24 w-24 text-primary/30" />
            )}
          </div>

          {/* Allergens */}
          {product.allergens && product.allergens.length > 0 && (
            <div className="space-y-2">
              <Link
                href={`/${locale}/allergenek`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-2"
              >
                <Info className="h-4 w-4" />
                {locale === 'hu' ? 'Allergének, további információ' : 'Allergens, additional information'}
              </Link>
              <div className="flex flex-wrap gap-2">
                {product.allergens.map((code) => {
                  const allergen = ALLERGENS_BY_CODE[code]
                  if (!allergen) return null
                  const Icon = allergen.icon
                  return (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground"
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {locale === 'hu' ? allergen.hu : allergen.en}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Toppings Selection */}
          {product.is_customizable && toppings.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">{t.menu.extraToppings}</Label>
              <div className="grid grid-cols-2 gap-2">
                {toppings.map((topping) => {
                  const isSelected = selectedToppings.some((t) => t.id === topping.id)
                  return (
                    <div
                      key={topping.id}
                      className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-muted hover:bg-muted/50'
                      }`}
                      onClick={() => handleToppingToggle(topping)}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToppingToggle(topping)}
                        />
                        <span className="text-sm">{getLocalizedName(topping, locale)}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        +{formatPrice(topping.price)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <Separator />

          {/* Quantity */}
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">
              {locale === 'hu' ? 'Mennyiség' : 'Quantity'}
            </Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Store Closed Warning */}
          {!isStoreOpen && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-center text-sm text-destructive">
              {locale === 'hu' 
                ? 'Az étterem jelenleg zárva van. Rendelést csak nyitvatartási időben fogadunk.'
                : 'The restaurant is currently closed. We only accept orders during opening hours.'}
            </div>
          )}

          {/* Total & Add to Cart */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-sm text-muted-foreground">{t.menu.total}</span>
              <p className="text-2xl font-bold text-primary">
                {formatPrice(totalPrice)} {t.common.currency}
              </p>
            </div>
            <Button size="lg" onClick={handleAddToCart} className="gap-2" disabled={!isStoreOpen}>
              <ShoppingCart className="h-4 w-4" />
              {locale === 'hu' ? 'Kosárba' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
