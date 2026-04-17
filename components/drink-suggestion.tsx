'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { GlassWater, Plus } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { formatPrice, getLocalizedName, type Product } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface DrinkSuggestionProps {
  drinks: Product[]
  locale: string
}

// Key for sessionStorage to track if suggestion was shown
const SUGGESTION_SHOWN_KEY = 'drink_suggestion_shown'

export function DrinkSuggestion({ drinks, locale }: DrinkSuggestionProps) {
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [suggestedDrink, setSuggestedDrink] = useState<Product | null>(null)
  const { items, addItem } = useCart()
  const pathname = usePathname()
  
  // Check if we're on checkout page
  const isCheckoutPage = pathname?.includes('/checkout')
  
  useEffect(() => {
    // Only show on checkout page and only once per session
    if (!isCheckoutPage) return
    
    // Check if already shown this session
    const alreadyShown = sessionStorage.getItem(SUGGESTION_SHOWN_KEY)
    if (alreadyShown) return
    
    // Check if there are pizzas but no drinks in cart
    const hasPizza = items.some(item => item.product.is_customizable)
    const hasDrink = items.some(item => 
      drinks.some(d => d.id === item.product.id)
    )
    
    // Get a random available drink
    const availableDrinks = drinks.filter(d => d.is_available)
    
    if (hasPizza && !hasDrink && availableDrinks.length > 0 && items.length > 0) {
      const randomDrink = availableDrinks[Math.floor(Math.random() * availableDrinks.length)]
      setSuggestedDrink(randomDrink)
      // Small delay for better UX
      setTimeout(() => {
        setShowSuggestion(true)
        // Mark as shown
        sessionStorage.setItem(SUGGESTION_SHOWN_KEY, 'true')
      }, 800)
    }
  }, [isCheckoutPage, items, drinks])
  
  const handleAddDrink = () => {
    if (suggestedDrink) {
      addItem(suggestedDrink, null, [], 1)
      setShowSuggestion(false)
    }
  }
  
  const t = {
    title: locale === 'hu' ? 'Ne felejtsd el az italt!' : "Don't forget your drink!",
    description: locale === 'hu' 
      ? 'Pizzához jól esik egy frissitő ital. Mit szólnál ehhez?'
      : 'A refreshing drink goes great with pizza. How about this one?',
    add: locale === 'hu' ? 'Hozzáadom' : 'Add to cart',
    noThanks: locale === 'hu' ? 'Köszönöm, nem kérek' : 'No thanks',
  }
  
  if (!suggestedDrink) return null
  
  return (
    <Dialog open={showSuggestion} onOpenChange={setShowSuggestion}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <GlassWater className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            {t.title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t.description}
          </DialogDescription>
        </DialogHeader>
        
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-background flex-shrink-0">
                {suggestedDrink.image_url ? (
                  <Image
                    src={suggestedDrink.image_url}
                    alt={getLocalizedName(suggestedDrink, locale)}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <GlassWater className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold truncate">
                  {getLocalizedName(suggestedDrink, locale)}
                </h4>
                <p className="text-lg font-bold text-primary">
                  {formatPrice(suggestedDrink.base_price)} {locale === 'hu' ? 'Ft' : 'HUF'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex flex-col gap-2 mt-2">
          <Button onClick={handleAddDrink} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            {t.add}
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setShowSuggestion(false)}
            className="w-full text-muted-foreground"
          >
            {t.noThanks}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
