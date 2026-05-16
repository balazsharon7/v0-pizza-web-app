'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Pizza, GlassWater, ShoppingCart, SlidersHorizontal, UtensilsCrossed, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProductModal } from '@/components/product-modal'
import { ClosedStoreAlert, useStoreStatus } from '@/components/closed-store-alert'
import { DrinkSuggestion } from '@/components/drink-suggestion'
import { useCart } from '@/lib/cart-context'
import { toast } from 'sonner'
import {
  formatPrice,
  getLocalizedName,
  getLocalizedDescription,
  type Category,
  type Product,
  type Size,
  type Topping,
} from '@/lib/types'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/get-dictionary'

interface MenuContentProps {
  categories: Category[]
  products: Product[]
  sizes: Size[]
  toppings: Topping[]
  locale: Locale
  dictionary: Dictionary
}

export function MenuContent({
  categories,
  products,
  sizes,
  toppings,
  locale,
  dictionary,
}: MenuContentProps) {
  // Default to first category (pizzas)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const storeStatus = useStoreStatus() // null = loading, true = open, false = closed
  const isStoreOpen = storeStatus !== false        // treat loading as open (optimistic)
  const { addItem } = useCart()
  const t = dictionary

  // Only show pizza and drinks categories
  const allowedSlugs = ['pizzas', 'drinks']
  const filteredCategories = categories.filter((c) => allowedSlugs.includes(c.slug))
  const allowedCategoryIds = filteredCategories.map((c) => c.id)

  // Set default category on first render
  const activeCategory = selectedCategory || filteredCategories[0]?.id || ''

  // Filter products to only show from allowed categories
  const availableProducts = products.filter((p) => allowedCategoryIds.includes(p.category_id))
  
  // Get drinks for suggestion
  const drinkCategory = categories.find(c => c.slug === 'drinks')
  const drinks = drinkCategory 
    ? products.filter(p => p.category_id === drinkCategory.id && p.is_available)
    : []

  const filteredProducts = availableProducts
    .filter((p) => p.category_id === activeCategory)
    .sort((a, b) => getLocalizedName(a, locale).localeCompare(getLocalizedName(b, locale), locale))

  const categoryImage = (slug: string): string | null => {
    switch (slug) {
      case 'pizzas':
        return '/menu/pizzas.png'
      case 'drinks':
        return '/menu/drinks.png'
      default:
        return null
    }
  }

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isStoreOpen) {
      toast.error(locale === 'hu' ? 'Az étterem jelenleg zárva van' : 'The restaurant is currently closed')
      return
    }
    // Always add directly to cart (without toppings)
    addItem(product, null, [], 1)
    toast.success(locale === 'hu' ? 'Hozzáadva a kosárhoz!' : 'Added to cart!')
  }

  const handleCustomize = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isStoreOpen) {
      toast.error(locale === 'hu' ? 'Az étterem jelenleg zárva van' : 'The restaurant is currently closed')
      return
    }
    setSelectedProduct(product)
  }

  return (
    <>
      {/* Closed Store Alert */}
      <ClosedStoreAlert locale={locale} />
      
      {/* Drink Suggestion */}
      <DrinkSuggestion drinks={drinks} locale={locale} />

      {/* Category Selection */}
      <div className="mb-10 animate-fade-in-up animation-delay-100">
        <div className="mx-auto flex w-fit gap-2 rounded-full border border-border/60 bg-background/70 p-1.5 backdrop-blur-sm shadow-sm">
          {filteredCategories.map((category) => {
            const isActive = activeCategory === category.id
            const img = categoryImage(category.slug)
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  group/cat relative flex items-center gap-3 rounded-full pl-2.5 pr-6 py-2.5 font-medium
                  transition-all duration-300
                  ${isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                    : 'text-muted-foreground hover:text-foreground'
                  }
                `}
                aria-pressed={isActive}
              >
                <span
                  className={`
                    relative h-10 w-10 rounded-full overflow-hidden flex items-center justify-center
                    transition-all duration-500
                    ${isActive
                      ? 'bg-black ring-2 ring-primary-foreground/30 shadow-inner'
                      : 'bg-black/85 ring-1 ring-border'
                    }
                    group-hover/cat:scale-105
                  `}
                >
                  {img ? (
                    <Image
                      src={img}
                      alt=""
                      width={64}
                      height={64}
                      className="h-full w-full object-cover scale-110"
                      aria-hidden
                    />
                  ) : category.slug === 'pizzas' ? (
                    <Pizza className="h-5 w-5 text-white/80" />
                  ) : (
                    <GlassWater className="h-5 w-5 text-white/80" />
                  )}
                </span>
                <span className="font-serif text-base tracking-tight">
                  {getLocalizedName(category, locale)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Store Closed Banner */}
      {!isStoreOpen && (
        <div className="mb-10 mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-2xl border border-destructive/25 bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent px-6 py-5">
            <div className="absolute -top-12 -right-8 w-40 h-40 rounded-full bg-destructive/15 blur-3xl" aria-hidden />
            <div className="relative flex items-start gap-4">
              <div className="shrink-0 flex h-11 w-11 items-center justify-center rounded-full bg-destructive/15 ring-1 ring-destructive/30">
                <Clock className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-serif text-lg font-semibold text-destructive">
                  {locale === 'hu' ? 'Most zárva tartunk' : "We're closed right now"}
                </p>
                <p className="mt-1 text-sm text-foreground/75 leading-relaxed">
                  {locale === 'hu'
                    ? 'Nyitvatartási időben szívesen várjuk a rendelésedet — addig nyugodtan nézz körül az étlapon.'
                    : 'We accept orders during opening hours — feel free to browse the menu in the meantime.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product, index) => {
          const category = filteredCategories.find((c) => c.id === product.category_id)

          return (
            <Card
              key={product.id}
              className={`
                group overflow-hidden transition-all duration-300 border-0 shadow-md bg-card rounded-2xl animate-scale-in
                ${isStoreOpen ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1.5' : 'cursor-not-allowed opacity-75'}
              `}
              style={{ animationDelay: `${Math.min(index * 60, 400)}ms` }}
              onClick={() => isStoreOpen && setSelectedProduct(product)}
            >
              {(() => {
                const isPizza = category?.slug === 'pizzas'
                const isDrink = category?.slug === 'drinks'
                const transparent = isPizza || isDrink
                const stageClasses = transparent
                  ? 'aspect-square relative pizza-card-stage'
                  : 'aspect-[4/3] bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center relative overflow-hidden'
                return (
              <div className={stageClasses}>
                {transparent && <div className="pizza-card-halo" aria-hidden />}
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={getLocalizedName(product, locale)}
                    fill
                    sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className={`transition-transform duration-700 ease-out ${
                      transparent
                        ? 'object-contain p-4 drop-shadow-[0_18px_28px_rgba(0,0,0,0.18)] group-hover:scale-[1.06]'
                        : 'object-cover group-hover:scale-110'
                    }`}
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    {isPizza ? (
                      <Pizza className="h-16 w-16 text-primary/20 group-hover:scale-110 transition-transform duration-300" />
                    ) : isDrink ? (
                      <GlassWater className="h-16 w-16 text-primary/20 group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <Pizza className="h-16 w-16 text-primary/20 group-hover:scale-110 transition-transform duration-300" />
                    )}
                  </div>
                )}
                {!transparent && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
                {/* Price badge */}
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center rounded-full bg-accent/90 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-accent-foreground shadow-sm">
                    {product.is_customizable && `${t.menu.from} `}{formatPrice(product.base_price)} {t.common.currency}
                  </span>
                </div>
                {/* Customize button for pizzas - top right corner */}
                {product.is_customizable && isStoreOpen && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute top-3 right-3 shadow-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    onClick={(e) => handleCustomize(product, e)}
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-1.5" />
                    {locale === 'hu' ? 'Testreszabás' : 'Customize'}
                  </Button>
                )}
              </div>
                )
              })()}
              <CardContent className="p-5">
                <h3 className="font-serif text-lg font-semibold tracking-tight group-hover:text-primary transition-colors duration-200">
                  {getLocalizedName(product, locale)}
                </h3>
                {getLocalizedDescription(product, locale) && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {getLocalizedDescription(product, locale)}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-end">
                  <Button
                    size="sm"
                    className="rounded-full px-5 shadow-sm hover:shadow-md transition-all"
                    onClick={(e) => handleQuickAdd(product, e)}
                    disabled={!isStoreOpen}
                  >
                    <ShoppingCart className="h-4 w-4 mr-1.5" />
                    {locale === 'hu' ? 'Kosárba' : 'Add'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="py-20 text-center animate-fade-in">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-serif font-medium text-muted-foreground">
            {locale === 'hu' ? 'Nincs termék ebben a kategóriában' : 'No products in this category'}
          </p>
          <p className="mt-2 text-sm text-muted-foreground/70">
            {locale === 'hu' ? 'Próbálj egy másik kategóriát!' : 'Try another category!'}
          </p>
        </div>
      )}

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        sizes={sizes}
        toppings={toppings}
        locale={locale}
        dictionary={dictionary}
        onClose={() => setSelectedProduct(null)}
        isStoreOpen={isStoreOpen}
      />
    </>
  )
}
