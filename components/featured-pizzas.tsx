'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatPrice, getLocalizedName, getLocalizedDescription, type Product } from '@/lib/types'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/get-dictionary'
import Link from 'next/link'

interface FeaturedPizzasProps {
  pizzas: Product[]
  locale: Locale
  dictionary: Dictionary
}

export function FeaturedPizzas({ pizzas, locale, dictionary }: FeaturedPizzasProps) {
  const t = dictionary

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
        <Card key={pizza.id} className="group overflow-hidden transition-shadow hover:shadow-lg">
          <div className="aspect-square bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
            <span className="text-7xl group-hover:scale-110 transition-transform duration-300">
              🍕
            </span>
          </div>
          <CardContent className="p-4">
            <h3 className="font-serif text-lg font-semibold">
              {getLocalizedName(pizza, locale)}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {getLocalizedDescription(pizza, locale)}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <span className="text-sm text-muted-foreground">{t.menu.from}</span>
                <span className="ml-1 font-semibold text-primary">
                  {formatPrice(pizza.base_price)} {t.common.currency}
                </span>
              </div>
              <Button asChild size="sm">
                <Link href={`/${locale}/menu`}>
                  {t.menu.addToCart}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
