'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductModal } from '@/components/product-modal'
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const t = dictionary

  const filteredProducts =
    selectedCategory === 'all'
      ? products
      : products.filter((p) => p.category_id === selectedCategory)

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'pizzas':
        return '🍕'
      case 'drinks':
        return '🥤'
      case 'desserts':
        return '🍰'
      case 'extras':
        return '🧀'
      default:
        return '🍴'
    }
  }

  return (
    <>
      {/* Category Tabs */}
      <div className="mb-8 overflow-x-auto">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="inline-flex h-auto gap-2 bg-transparent p-0">
            <TabsTrigger
              value="all"
              className="rounded-full border bg-background px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {t.menu.allCategories}
            </TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="rounded-full border bg-background px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className="mr-2">{getCategoryIcon(category.slug)}</span>
                {getLocalizedName(category, locale)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Products Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product) => {
          const category = categories.find((c) => c.id === product.category_id)
          
          return (
            <Card
              key={product.id}
              className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg"
              onClick={() => setSelectedProduct(product)}
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
                  <span className="text-7xl group-hover:scale-110 transition-transform duration-300">
                    {category ? getCategoryIcon(category.slug) : '🍴'}
                  </span>
                )}
                {product.is_customizable && (
                  <span className="absolute top-2 right-2 rounded-full bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">
                    {t.menu.customize}
                  </span>
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
                  <Button size="sm" onClick={(e) => {
                    e.stopPropagation()
                    setSelectedProduct(product)
                  }}>
                    {product.is_customizable ? t.menu.customize : t.menu.addToCart}
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
      />
    </>
  )
}
