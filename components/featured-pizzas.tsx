'use client'

import Image from 'next/image'
import { ShoppingCart, Pizza } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatPrice, getLocalizedName, getLocalizedDescription, type Product } from '@/lib/types'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/get-dictionary'
import { useCart } from '@/lib/cart-context'
import { toast } from 'sonner'

interface FeaturedPizzasProps {
  pizzas: Product[]
  locale: Locale
  dictionary: Dictionary
}

export function FeaturedPizzas({ pizzas, locale, dictionary }: FeaturedPizzasProps) {
  const t = dictionary
  const { addItem } = useCart()

  const handleAddToCart = (pizza: Product) => {
    addItem(pizza, null, [], 1)
    toast.success(locale === 'hu' ? 'Hozzáadva a kosárhoz!' : 'Added to cart!')
  }

  if (pizzas.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        {locale === 'hu' ? 'Nincs elérhető pizza' : 'No pizzas available'}
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {pizzas.map((pizza) => (
        <Card key={pizza.id} className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 shadow-md bg-card">
          <div className="aspect-[4/3] bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center relative overflow-hidden">
            {pizza.image_url ? (
              <Image
                src={pizza.image_url}
                alt={getLocalizedName(pizza, locale)}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <Pizza className="h-16 w-16 text-primary/20 group-hover:scale-110 transition-transform duration-300" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <CardContent className="p-5">
            <h3 className="font-serif text-lg font-semibold tracking-tight">
              {getLocalizedName(pizza, locale)}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {getLocalizedDescription(pizza, locale)}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">{t.menu.from}</span>
                <span className="font-serif font-semibold text-lg text-primary">
                  {formatPrice(pizza.base_price)} {t.common.currency}
                </span>
              </div>
              <Button size="sm" className="rounded-full px-4" onClick={() => handleAddToCart(pizza)}>
                <ShoppingCart className="h-4 w-4 mr-1.5" />
                {locale === 'hu' ? 'Kosárba' : 'Add'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
