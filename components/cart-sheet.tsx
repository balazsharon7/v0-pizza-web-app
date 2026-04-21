'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Minus, Plus, ShoppingBag, Trash2, Pizza, GlassWater } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/lib/cart-context'
import { formatPrice, getLocalizedName } from '@/lib/types'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/get-dictionary'

interface CartSheetProps {
  locale: Locale
  dictionary: Dictionary
}

export function CartSheet({ locale, dictionary }: CartSheetProps) {
  const { items, isOpen, toggleCart, removeItem, updateQuantity, subtotal, itemCount } = useCart()
  const t = dictionary

  const deliveryFee = 500
  const freeDeliveryThreshold = 8000
  const minOrder = 3000

  const isFreeDelivery = subtotal >= freeDeliveryThreshold
  const actualDeliveryFee = isFreeDelivery ? 0 : deliveryFee
  const total = subtotal + actualDeliveryFee
  const canCheckout = subtotal >= minOrder

  return (
    <Sheet open={isOpen} onOpenChange={(open) => toggleCart(open)}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            {t.cart.title} ({itemCount})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-full bg-muted p-6">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">{t.cart.empty}</h3>
              <p className="text-sm text-muted-foreground">{t.cart.emptyDescription}</p>
            </div>
            <Button asChild onClick={() => toggleCart(false)}>
              <Link href={`/${locale}/menu`}>{t.nav.viewMenu}</Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-lg bg-muted overflow-hidden">
                      {item.product.image_url ? (
                        <Image
                          src={item.product.image_url}
                          alt={getLocalizedName(item.product, locale)}
                          fill
                          className="object-cover"
                        />
                      ) : item.product.is_customizable ? (
                        <Pizza className="h-8 w-8 text-muted-foreground" />
                      ) : (
                        <GlassWater className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="font-medium leading-none">
                        {getLocalizedName(item.product, locale)}
                      </h4>
                      {item.size && (
                        <p className="text-xs text-muted-foreground">
                          {getLocalizedName(item.size, locale)}
                          {item.size.size_cm && ` (${item.size.size_cm} cm)`}
                        </p>
                      )}
                      {item.toppings.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          + {item.toppings.map((t) => getLocalizedName(t, locale)).join(', ')}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {formatPrice(item.totalPrice)} {t.common.currency}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t.cart.subtotal}</span>
                  <span>{formatPrice(subtotal)} {t.common.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.cart.deliveryFee}</span>
                  <span className={isFreeDelivery ? 'text-accent' : ''}>
                    {isFreeDelivery ? t.cart.freeDelivery : `${formatPrice(deliveryFee)} ${t.common.currency}`}
                  </span>
                </div>
                {!isFreeDelivery && (
                  <p className="text-xs text-muted-foreground">
                    {t.cart.freeDeliveryFrom.replace('{amount}', formatPrice(freeDeliveryThreshold))}
                  </p>
                )}
                <Separator />
                <div className="flex justify-between text-base font-semibold">
                  <span>{t.cart.total}</span>
                  <span>{formatPrice(total)} {t.common.currency}</span>
                </div>
              </div>

              {!canCheckout && (
                <p className="text-center text-sm text-destructive">
                  {t.cart.minOrder.replace('{amount}', formatPrice(minOrder))}
                </p>
              )}

              <Button
                asChild
                className="w-full"
                size="lg"
                disabled={!canCheckout}
                onClick={() => canCheckout && toggleCart(false)}
              >
                <Link href={`/${locale}/checkout`}>
                  {t.cart.checkout}
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
