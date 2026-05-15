'use client'

import Image from 'next/image'
import { ShoppingCart, Pizza, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatPrice, getLocalizedName, getLocalizedDescription, type Product } from '@/lib/types'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/get-dictionary'
import { useCart } from '@/lib/cart-context'
import { useStoreStatus } from '@/components/closed-store-alert'
import { toast } from 'sonner'
import { TiltCard } from '@/components/animations/tilt-card'

interface FeaturedPizzasProps {
  pizzas: Product[]
  locale: Locale
  dictionary: Dictionary
}

export function FeaturedPizzas({ pizzas, locale, dictionary }: FeaturedPizzasProps) {
  const t = dictionary
  const { addItem } = useCart()
  const isStoreOpen = useStoreStatus()

  const handleAddToCart = (pizza: Product) => {
    if (!isStoreOpen) {
      toast.error(locale === 'hu' ? 'Az étterem jelenleg zárva van' : 'The restaurant is currently closed')
      return
    }
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
      {pizzas.map((pizza, index) => (
        <TiltCard
          key={pizza.id}
          max={6}
          className={`rounded-2xl animate-fade-in-up ${index === 1 ? 'animation-delay-100' : index === 2 ? 'animation-delay-200' : index === 3 ? 'animation-delay-300' : ''}`}
        >
          <Card className="group overflow-hidden transition-all duration-300 hover:shadow-2xl border-0 shadow-md bg-card rounded-2xl">
            <div className="pizza-card-stage aspect-square relative">
              <div className="pizza-card-halo" aria-hidden />
              {pizza.image_url ? (
                <Image
                  src={pizza.image_url}
                  alt={getLocalizedName(pizza, locale)}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-contain p-4 drop-shadow-[0_18px_28px_rgba(0,0,0,0.18)] group-hover:scale-[1.06] transition-transform duration-[1200ms] ease-out"
                />
              ) : (
                <Pizza className="h-16 w-16 text-primary/20 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500" />
              )}
              <div className="absolute top-3 left-3 z-10 transition-transform duration-300 group-hover:-translate-y-0.5">
                <span className="inline-flex items-center rounded-full bg-accent/90 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-accent-foreground shadow-sm">
                  {t.menu.from} {formatPrice(pizza.base_price)} {t.common.currency}
                </span>
              </div>
            </div>
            <CardContent className="p-5">
              <h3 className="font-serif text-lg font-semibold tracking-tight group-hover:text-primary transition-colors duration-200">
                {getLocalizedName(pizza, locale)}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {getLocalizedDescription(pizza, locale)}
              </p>
              <div className="mt-4 flex items-center justify-end">
                <Button
                  size="sm"
                  className="rounded-full px-5 shadow-sm hover:shadow-md hover:scale-105 transition-all"
                  onClick={() => handleAddToCart(pizza)}
                  disabled={isStoreOpen === false}
                  title={isStoreOpen === false ? (locale === 'hu' ? 'Az étterem zárva van' : 'Restaurant is closed') : undefined}
                >
                  {isStoreOpen === false
                    ? <><Lock className="h-4 w-4 mr-1.5" />{locale === 'hu' ? 'Zárva' : 'Closed'}</>
                    : <><ShoppingCart className="h-4 w-4 mr-1.5 transition-transform group-hover:-translate-y-0.5" />{locale === 'hu' ? 'Kosárba' : 'Add'}</>
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </TiltCard>
      ))}
    </div>
  )
}
