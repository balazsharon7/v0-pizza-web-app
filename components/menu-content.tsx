'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Pizza, GlassWater, ShoppingCart, SlidersHorizontal } from 'lucide-react'
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
  const [isStoreOpen, setIsStoreOpen] = useState<boolean>(true)
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

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'pizzas':
        return <Pizza className="h-5 w-5" />
      case 'drinks':
        return <GlassWater className="h-5 w-5" />
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
      <ClosedStoreAlert locale={locale} onStatusChange={setIsStoreOpen} />
      
      {/* Drink Suggestion */}
      <DrinkSuggestion drinks={drinks} locale={locale} />

      {/* Category Selection */}
      <div className="mb-10">
        <div className="flex flex-wrap justify-center gap-3">
          {filteredCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-200
                ${activeCategory === category.id
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105'
                  : 'bg-muted hover:bg-muted/80 text-foreground'
                }
              `}
            >
              {getCategoryIcon(category.slug)}
              {getLocalizedName(category, locale)}
            </button>
          ))}
        </div>
      </div>

      {/* Store Closed Banner */}
      {!isStoreOpen && (
        <div className="mb-8 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
          <p className="text-destructive font-medium">
            {locale === 'hu' 
              ? 'Az étterem jelenleg zárva van. Rendelést csak nyitvatartási időben fogadunk.'
              : 'The restaurant is currently closed. We only accept orders during opening hours.'}
          </p>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product) => {
          const category = filteredCategories.find((c) => c.id === product.category_id)
          
          return (
            <Card
              key={product.id}
              className={`
                group overflow-hidden transition-all hover:shadow-lg
                ${isStoreOpen ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}
              `}
              onClick={() => isStoreOpen && setSelectedProduct(product)}
            >
              <div className="aspect-square bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center relative overflow-hidden">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={getLocalizedName(product, locale)}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    {category?.slug === 'pizzas' ? (
                      <Pizza className="h-24 w-24 text-primary/30 group-hover:scale-110 transition-transform duration-300" />
                    ) : category?.slug === 'drinks' ? (
                      <GlassWater className="h-24 w-24 text-primary/30 group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <Pizza className="h-24 w-24 text-primary/30 group-hover:scale-110 transition-transform duration-300" />
                    )}
                  </div>
                )}
                {/* Customize button for pizzas - top right corner */}
                {product.is_customizable && isStoreOpen && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 right-2 shadow-md"
                    onClick={(e) => handleCustomize(product, e)}
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-1" />
                    {locale === 'hu' ? 'Testreszabás' : 'Customize'}
                  </Button>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-serif text-lg font-semibold group-hover:text-primary transition-colors">
                  {getLocalizedName(product, locale)}
                </h3>
                {getLocalizedDescription(product, locale) && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {getLocalizedDescription(product, locale)}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    {product.is_customizable && (
                      <span className="text-sm text-muted-foreground">{t.menu.from} </span>
                    )}
                    <span className="font-semibold text-primary">
                      {formatPrice(product.base_price)} {t.common.currency}
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={(e) => handleQuickAdd(product, e)}
                    disabled={!isStoreOpen}
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    {locale === 'hu' ? 'Kosárba' : 'Add'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          {locale === 'hu' ? 'Nincs termék ebben a kategóriában' : 'No products in this category'}
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
