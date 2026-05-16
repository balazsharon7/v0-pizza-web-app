'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import { Pencil, Trash2, Plus, Upload, ImageIcon, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { updateProduct, createProduct as createProductAction, deleteProduct as deleteProductAction, revalidateAll } from '@/app/actions/admin'

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
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name_hu: '',
    name_en: '',
    description_hu: '',
    description_en: '',
    base_price: 0,
    category_id: '',
    image_url: '' as string | null,
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
      image_url: product.image_url,
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
      image_url: null,
      is_available: true,
      is_customizable: true,
    })
    setIsCreating(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error(locale === 'hu' ? 'Érvénytelen fájltípus' : 'Invalid file type')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(locale === 'hu' ? 'A fájl túl nagy (max 5MB)' : 'File too large (max 5MB)')
      return
    }

    setIsUploading(true)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const { url } = await response.json()
      setFormData({ ...formData, image_url: url })
      toast.success(locale === 'hu' ? 'Kép feltöltve!' : 'Image uploaded!')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(locale === 'hu' ? 'Feltöltési hiba' : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name_hu || !formData.name_en) {
      toast.error(locale === 'hu' ? 'Add meg a nevet mindkét nyelven' : 'Enter name in both languages')
      return
    }

    setIsSaving(true)
    
    try {
      const dataToSave = {
        name_hu: formData.name_hu,
        name_en: formData.name_en,
        description_hu: formData.description_hu || undefined,
        description_en: formData.description_en || undefined,
        base_price: formData.base_price,
        category_id: formData.category_id,
        image_url: formData.image_url || undefined,
        is_available: formData.is_available,
        is_customizable: formData.is_customizable,
      }

      if (editingProduct) {
        const result = await updateProduct(editingProduct.id, dataToSave)
        if (!result.success) throw new Error(result.error)
        toast.success(locale === 'hu' ? 'Termék frissítve!' : 'Product updated!')
      } else {
        const result = await createProductAction({
          ...dataToSave,
          category_id: formData.category_id,
        })
        if (!result.success) throw new Error(result.error)
        toast.success(locale === 'hu' ? 'Termék létrehozva!' : 'Product created!')
      }
      
      setEditingProduct(null)
      setIsCreating(false)
      router.refresh()
    } catch (error) {
      console.error('Save error:', error)
      toast.error(locale === 'hu' ? 'Hiba történt' : 'Error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteProduct) return
    
    try {
      const result = await deleteProductAction(deleteProduct.id)
      if (!result.success) throw new Error(result.error)
      toast.success(locale === 'hu' ? 'Termék törölve!' : 'Product deleted!')
      setDeleteProduct(null)
      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(locale === 'hu' ? 'Hiba történt' : 'Error occurred')
    }
  }

  const handleToggleAvailability = async (product: Product) => {
    try {
      const result = await updateProduct(product.id, { is_available: !product.is_available })
      if (!result.success) throw new Error(result.error)
      router.refresh()
    } catch (error) {
      console.error('Toggle error:', error)
      toast.error(locale === 'hu' ? 'Hiba történt' : 'Error occurred')
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{locale === 'hu' ? 'Termékek' : 'Products'}</h2>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {locale === 'hu' ? 'Új termék' : 'New Product'}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id} className={!product.is_available ? 'opacity-60' : ''}>
            <CardContent className="p-4">
              <div className="flex gap-3">
                {/* Product Image */}
                <div className="flex-shrink-0">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name_hu}
                      width={80}
                      height={80}
                      className="rounded-lg object-cover w-20 h-20"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{getLocalizedName(product, locale)}</h3>
                  {product.category && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {getLocalizedName(product.category, locale)}
                    </Badge>
                  )}
                  <p className="mt-1 font-bold text-primary">
                    {formatPrice(product.base_price)} Ft
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Switch
                      checked={product.is_available}
                      onCheckedChange={() => handleToggleAvailability(product)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {product.is_available
                        ? (locale === 'hu' ? 'Elérhető' : 'Available')
                        : (locale === 'hu' ? 'Nem elérhető' : 'Unavailable')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
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
                    onClick={() => setDeleteProduct(product)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {locale === 'hu' ? 'Nincsenek termékek' : 'No products'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {locale === 'hu' ? 'Hozz létre az első terméket!' : 'Create your first product!'}
          </p>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {locale === 'hu' ? 'Új termék' : 'New Product'}
          </Button>
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={!!editingProduct || isCreating} onOpenChange={(open) => {
        if (!open) {
          setEditingProduct(null)
          setIsCreating(false)
        }
      }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[90dvh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {editingProduct
                ? (locale === 'hu' ? 'Termék szerkesztése' : 'Edit Product')
                : (locale === 'hu' ? 'Új termék' : 'New Product')}
            </DialogTitle>
            <DialogDescription>
              {locale === 'hu'
                ? 'Töltsd ki a termék adatait mindkét nyelven.'
                : 'Fill in the product details in both languages.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label>{locale === 'hu' ? 'Termék képe' : 'Product Image'}</Label>
              <div className="flex flex-col sm:flex-row items-start gap-3">
                {formData.image_url ? (
                  <div className="relative flex-shrink-0">
                    <Image
                      src={formData.image_url}
                      alt="Product preview"
                      width={100}
                      height={100}
                      className="rounded-lg object-cover w-[100px] h-[100px]"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-7 w-7"
                      onClick={() => setFormData({ ...formData, image_url: null })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-[100px] h-[100px] flex-shrink-0 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
                <div className="w-full sm:flex-1">
                  <Label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center w-full h-[100px] border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <Upload className="h-7 w-7 text-muted-foreground mb-1" />
                    <span className="text-sm font-medium">
                      {isUploading
                        ? (locale === 'hu' ? 'Feltöltés...' : 'Uploading...')
                        : (locale === 'hu' ? 'Kép feltöltése' : 'Upload image')}
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5">PNG, JPG, WebP (max 5MB)</span>
                  </Label>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>{locale === 'hu' ? 'Kategória' : 'Category'}</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder={locale === 'hu' ? 'Válassz kategóriát' : 'Select category'} />
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

            {/* Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name_hu">{locale === 'hu' ? 'Név (magyar)' : 'Name (Hungarian)'} *</Label>
                <Input
                  id="name_hu"
                  className="h-12"
                  value={formData.name_hu}
                  onChange={(e) => setFormData({ ...formData, name_hu: e.target.value })}
                  placeholder="pl. Margherita"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_en">{locale === 'hu' ? 'Név (angol)' : 'Name (English)'} *</Label>
                <Input
                  id="name_en"
                  className="h-12"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  placeholder="e.g. Margherita"
                />
              </div>
            </div>

            {/* Descriptions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description_hu">{locale === 'hu' ? 'Leírás (magyar)' : 'Description (HU)'}</Label>
                <Textarea
                  id="description_hu"
                  value={formData.description_hu}
                  onChange={(e) => setFormData({ ...formData, description_hu: e.target.value })}
                  placeholder={locale === 'hu' ? 'Összetevők, jellemzők...' : 'Ingredients, features...'}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description_en">{locale === 'hu' ? 'Leírás (angol)' : 'Description (EN)'}</Label>
                <Textarea
                  id="description_en"
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  placeholder="Ingredients, features..."
                  rows={3}
                />
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="base_price">{locale === 'hu' ? 'Alapár (Ft)' : 'Base Price (HUF)'}</Label>
              <Input
                id="base_price"
                type="number"
                min="0"
                step="10"
                inputMode="numeric"
                placeholder="0"
                className="h-12"
                value={formData.base_price === 0 ? '' : formData.base_price}
                onChange={(e) => {
                  const raw = e.target.value
                  if (raw === '') {
                    setFormData({ ...formData, base_price: 0 })
                    return
                  }
                  const n = parseInt(raw, 10)
                  setFormData({
                    ...formData,
                    base_price: Number.isFinite(n) && n >= 0 ? n : 0,
                  })
                }}
              />
            </div>

            {/* Switches */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center justify-between sm:justify-start gap-3 p-3 border rounded-lg sm:border-0 sm:p-0">
                <Label htmlFor="is_available" className="cursor-pointer">
                  {locale === 'hu' ? 'Elérhető' : 'Available'}
                </Label>
                <Switch
                  id="is_available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                />
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-3 p-3 border rounded-lg sm:border-0 sm:p-0">
                <Label htmlFor="is_customizable" className="cursor-pointer">
                  {locale === 'hu' ? 'Testreszabható (méret, feltét)' : 'Customizable (size, toppings)'}
                </Label>
                <Switch
                  id="is_customizable"
                  checked={formData.is_customizable}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_customizable: checked })}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button variant="outline" className="w-full sm:w-auto h-12" onClick={() => {
              setEditingProduct(null)
              setIsCreating(false)
            }}>
              {t.common.cancel}
            </Button>
            <Button className="w-full sm:w-auto h-12" onClick={handleSave} disabled={isSaving || isUploading}>
              {isSaving ? (locale === 'hu' ? 'Mentés...' : 'Saving...') : t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locale === 'hu' ? 'Biztosan törlöd?' : 'Are you sure?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locale === 'hu'
                ? `A "${deleteProduct?.name_hu}" termék véglegesen törlődik. Ez a művelet nem vonható vissza.`
                : `The product "${deleteProduct?.name_en}" will be permanently deleted. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{locale === 'hu' ? 'Mégse' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {locale === 'hu' ? 'Törlés' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
