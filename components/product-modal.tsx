'use client'

import { useState, useEffect } from 'react'
import { Check, Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
}

export function ProductModal({
  product,
  sizes,
  toppings,
  locale,
  dictionary,
  onClose,
}: ProductModalProps) {
  const { addItem, toggleCart } = useCart()
  const t = dictionary

  const [selectedSize, setSelectedSize] = useState<Size | null>(null)
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([])
  const [quantity, setQuantity] = useState(1)

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setSelectedSize(product.is_customizable ? sizes[1] || sizes[0] || null : null)
      setSelectedToppings([])
      setQuantity(1)
    }
  }, [product, sizes])

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
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Image */}
          <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center">
            <span className="text-8xl">🍕</span>
          </div>

          {/* Description */}
          {getLocalizedDescription(product, locale) && (
            <p className="text-muted-foreground">
              {getLocalizedDescription(product, locale)}
            </p>
          )}

          {/* Size Selection */}
          {product.is_customizable && sizes.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">{t.menu.selectSize}</Label>
              <RadioGroup
                value={selectedSize?.id || ''}
                onValueChange={(value) => {
                  const size = sizes.find((s) => s.id === value)
                  setSelectedSize(size || null)
                }}
                className="grid grid-cols-3 gap-3"
              >
                {sizes.map((size) => {
                  const price = Math.round(basePrice * size.price_multiplier)
                  return (
                    <div key={size.id}>
                      <RadioGroupItem
                        value={size.id}
                        id={size.id}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={size.id}
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
                      >
                        <span className="font-semibold">{getLocalizedName(size, locale)}</span>
                        {size.size_cm && (
                          <span className="text-xs text-muted-foreground">{size.size_cm} cm</span>
                        )}
                        <span className="mt-1 text-sm text-primary">
                          {formatPrice(price)} {t.common.currency}
                        </span>
                      </Label>
                    </div>
                  )
                })}
              </RadioGroup>
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

          {/* Total & Add to Cart */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-sm text-muted-foreground">{t.menu.total}</span>
              <p className="text-2xl font-bold text-primary">
                {formatPrice(totalPrice)} {t.common.currency}
              </p>
            </div>
            <Button size="lg" onClick={handleAddToCart} className="gap-2">
              <Check className="h-4 w-4" />
              {t.menu.addToCart}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
