'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Trash2, Plus, GripVertical } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import { getLocalizedName, type Category } from '@/lib/types'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/get-dictionary'
import { createClient } from '@/lib/supabase/client'

interface CategoriesListProps {
  categories: Category[]
  locale: Locale
  dictionary: Dictionary
}

export function CategoriesList({ categories, locale, dictionary }: CategoriesListProps) {
  const router = useRouter()
  const t = dictionary
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name_hu: '',
    name_en: '',
    slug: '',
    sort_order: 0,
    is_active: true,
  })

  const handleEdit = (category: Category) => {
    setFormData({
      name_hu: category.name_hu,
      name_en: category.name_en,
      slug: category.slug,
      sort_order: category.sort_order,
      is_active: category.is_active,
    })
    setEditingCategory(category)
  }

  const handleCreate = () => {
    setFormData({
      name_hu: '',
      name_en: '',
      slug: '',
      sort_order: categories.length,
      is_active: true,
    })
    setIsCreating(true)
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöôő]/g, 'o')
      .replace(/[úùüûű]/g, 'u')
      .replace(/[ñ]/g, 'n')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleNameChange = (name: string, lang: 'hu' | 'en') => {
    const newFormData = { ...formData, [`name_${lang}`]: name }
    if (!editingCategory && lang === 'en') {
      newFormData.slug = generateSlug(name)
    }
    setFormData(newFormData)
  }

  const handleSave = async () => {
    if (!formData.name_hu || !formData.name_en || !formData.slug) {
      toast.error(locale === 'hu' ? 'Töltsd ki a kötelező mezőket' : 'Fill in required fields')
      return
    }

    setIsSaving(true)
    const supabase = createClient()
    
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(formData)
          .eq('id', editingCategory.id)
        
        if (error) throw error
        toast.success(locale === 'hu' ? 'Kategória frissítve!' : 'Category updated!')
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(formData)
        
        if (error) throw error
        toast.success(locale === 'hu' ? 'Kategória létrehozva!' : 'Category created!')
      }
      
      setEditingCategory(null)
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
    if (!deleteCategory) return
    
    const supabase = createClient()
    
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', deleteCategory.id)
      
      if (error) throw error
      toast.success(locale === 'hu' ? 'Kategória törölve!' : 'Category deleted!')
      setDeleteCategory(null)
      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(locale === 'hu' ? 'Hiba történt (lehet hogy van hozzá tartozó termék)' : 'Error occurred (category may have products)')
    }
  }

  const handleToggleActive = async (category: Category) => {
    const supabase = createClient()
    
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id)
      
      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error('Toggle error:', error)
      toast.error(locale === 'hu' ? 'Hiba történt' : 'Error occurred')
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{locale === 'hu' ? 'Kategóriák' : 'Categories'}</h2>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {locale === 'hu' ? 'Új kategória' : 'New Category'}
        </Button>
      </div>

      <div className="space-y-2">
        {categories.map((category) => (
          <Card key={category.id} className={!category.is_active ? 'opacity-60' : ''}>
            <CardContent className="p-4 flex items-center gap-4">
              <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
              
              <div className="flex-1">
                <h3 className="font-semibold">{getLocalizedName(category, locale)}</h3>
                <Badge variant="outline" className="mt-1 text-xs">
                  {category.slug}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={category.is_active}
                  onCheckedChange={() => handleToggleActive(category)}
                />
                <span className="text-sm text-muted-foreground w-20">
                  {category.is_active
                    ? (locale === 'hu' ? 'Aktív' : 'Active')
                    : (locale === 'hu' ? 'Inaktív' : 'Inactive')}
                </span>
              </div>

              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteCategory(category)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">
            {locale === 'hu' ? 'Nincsenek kategóriák' : 'No categories'}
          </h3>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {locale === 'hu' ? 'Új kategória' : 'New Category'}
          </Button>
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={!!editingCategory || isCreating} onOpenChange={(open) => {
        if (!open) {
          setEditingCategory(null)
          setIsCreating(false)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory
                ? (locale === 'hu' ? 'Kategória szerkesztése' : 'Edit Category')
                : (locale === 'hu' ? 'Új kategória' : 'New Category')}
            </DialogTitle>
            <DialogDescription>
              {locale === 'hu'
                ? 'Add meg a kategória nevét mindkét nyelven.'
                : 'Enter the category name in both languages.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name_hu">{locale === 'hu' ? 'Név (magyar)' : 'Name (Hungarian)'} *</Label>
                <Input
                  id="name_hu"
                  value={formData.name_hu}
                  onChange={(e) => handleNameChange(e.target.value, 'hu')}
                  placeholder="pl. Pizzák"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_en">{locale === 'hu' ? 'Név (angol)' : 'Name (English)'} *</Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={(e) => handleNameChange(e.target.value, 'en')}
                  placeholder="e.g. Pizzas"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                placeholder="pizzas"
              />
              <p className="text-xs text-muted-foreground">
                {locale === 'hu' ? 'URL-barát azonosító (automatikusan generálódik)' : 'URL-friendly identifier (auto-generated)'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">{locale === 'hu' ? 'Aktív' : 'Active'}</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditingCategory(null)
              setIsCreating(false)
            }}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (locale === 'hu' ? 'Mentés...' : 'Saving...') : t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locale === 'hu' ? 'Biztosan törlöd?' : 'Are you sure?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locale === 'hu'
                ? `A "${deleteCategory?.name_hu}" kategória véglegesen törlődik. A hozzá tartozó termékek is törlődnek!`
                : `The category "${deleteCategory?.name_en}" will be permanently deleted. Associated products will also be deleted!`}
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
