'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatPrice, getLocalizedName, type Product, type Category } from '@/lib/types'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/get-dictionary'
import { createClient } from '@/lib/supabase/client'

interface ProductsListProps {
  products: (Product & { category?: Category })[]
  categories: Category[]
  locale: Locale
  dictionary: Dictionary
}

export function ProductsList({ products, categories, locale, dictionary }: ProductsListProps) {
  const router = useRouter()
  const t = dictionary
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name_hu: '',
    name_en: '',
    description_hu: '',
    description_en: '',
    base_price: 0,
    category_id: '',
    is_available: true,
    is_customizable: true,
  })

  const handleEdit = (product: Product) => {
    setFormData({
      name_hu: product.name_hu,
      name_en: product.name_en,
      description_hu: product.description_hu || '',
      description_en: product.description_en || '',
      base_price: product.base_price,
      category_id: product.category_id,
      is_available: product.is_available,
      is_customizable: product.is_customizable,
    })
    setEditingProduct(product)
  }

  const handleCreate = () => {
    setFormData({
      name_hu: '',
      name_en: '',
      description_hu: '',
      description_en: '',
      base_price: 0,
      category_id: categories[0]?.id || '',
      is_available: true,
      is_customizable: true,
    })
    setIsCreating(true)
  }

  const handleSave = async () => {
    const supabase = createClient()
    
    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(formData)
          .eq('id', editingProduct.id)
        
        if (error) throw error
        toast.success(locale === 'hu' ? 'Termék frissítve' : 'Product updated')
      } else {
        const { error } = await supabase
          .from('products')
          .insert({ ...formData, sort_order: products.length })
        
        if (error) throw error
        toast.success(locale === 'hu' ? 'Termék létrehozva' : 'Product created')
      }
      
      setEditingProduct(null)
      setIsCreating(false)
      router.refresh()
    } catch (error) {
      console.error('Save error:', error)
      toast.error(locale === 'hu' ? 'Hiba történt' : 'Error occurred')
    }
  }

  const handleDelete = async (productId: string) => {
    if (!confirm(locale === 'hu' ? 'Biztosan törlöd?' : 'Are you sure?')) return
    
    const supabase = createClient()
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
      
      if (error) throw error
      toast.success(locale === 'hu' ? 'Termék törölve' : 'Product deleted')
      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(locale === 'hu' ? 'Hiba történt' : 'Error occurred')
    }
  }

  const handleToggleAvailability = async (product: Product) => {
    const supabase = createClient()
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: !product.is_available })
        .eq('id', product.id)
      
      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error('Toggle error:', error)
      toast.error(locale === 'hu' ? 'Hiba történt' : 'Error occurred')
    }
  }

  return (
    <>
      <Button onClick={handleCreate} className="gap-2">
        <Plus className="h-4 w-4" />
        {locale === 'hu' ? 'Új termék' : 'New Product'}
      </Button>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id} className={!product.is_available ? 'opacity-50' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold">{getLocalizedName(product, locale)}</h3>
                  {product.category && (
                    <Badge variant="outline" className="mt-1">
                      {getLocalizedName(product.category, locale)}
                    </Badge>
                  )}
                  <p className="mt-2 font-bold text-primary">
                    {formatPrice(product.base_price)} Ft
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(product)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Switch
                  checked={product.is_available}
                  onCheckedChange={() => handleToggleAvailability(product)}
                />
                <span className="text-sm text-muted-foreground">
                  {product.is_available
                    ? (locale === 'hu' ? 'Elérhető' : 'Available')
                    : (locale === 'hu' ? 'Nem elérhető' : 'Unavailable')}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={!!editingProduct || isCreating} onOpenChange={(open) => {
        if (!open) {
          setEditingProduct(null)
          setIsCreating(false)
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProduct
                ? (locale === 'hu' ? 'Termék szerkesztése' : 'Edit Product')
                : (locale === 'hu' ? 'Új termék' : 'New Product')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name_hu">Név (HU)</Label>
                <Input
                  id="name_hu"
                  value={formData.name_hu}
                  onChange={(e) => setFormData({ ...formData, name_hu: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_en">Name (EN)</Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description_hu">Leírás (HU)</Label>
              <Textarea
                id="description_hu"
                value={formData.description_hu}
                onChange={(e) => setFormData({ ...formData, description_hu: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description_en">Description (EN)</Label>
              <Textarea
                id="description_en"
                value={formData.description_en}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base_price">{locale === 'hu' ? 'Ár (Ft)' : 'Price (Ft)'}</Label>
                <Input
                  id="base_price"
                  type="number"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">{locale === 'hu' ? 'Kategória' : 'Category'}</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {getLocalizedName(cat, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                />
                <Label>{locale === 'hu' ? 'Elérhető' : 'Available'}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_customizable}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_customizable: checked })}
                />
                <Label>{locale === 'hu' ? 'Testreszabható' : 'Customizable'}</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditingProduct(null)
              setIsCreating(false)
            }}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleSave}>{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
