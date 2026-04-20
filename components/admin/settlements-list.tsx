'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, MapPin, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { formatPrice, getLocalizedName, type DeliverySettlement, type DeliveryZone } from '@/lib/types'
import type { Locale } from '@/lib/i18n/config'
import { createClient } from '@/lib/supabase/client'

interface SettlementsListProps {
  settlements: DeliverySettlement[]
  zones: DeliveryZone[]
  locale: Locale
}

export function SettlementsList({ settlements: initialSettlements, zones, locale }: SettlementsListProps) {
  const router = useRouter()
  const [settlements, setSettlements] = useState(initialSettlements)
  const [isCreating, setIsCreating] = useState(false)
  const [editingSettlement, setEditingSettlement] = useState<DeliverySettlement | null>(null)
  const [deleteSettlement, setDeleteSettlement] = useState<DeliverySettlement | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    zone_id: '',
    zip_codes: '',
    is_active: true,
  })

  const t = {
    title: locale === 'hu' ? 'Települések kezelése' : 'Manage Settlements',
    addNew: locale === 'hu' ? 'Új település' : 'Add Settlement',
    edit: locale === 'hu' ? 'Szerkesztés' : 'Edit',
    delete: locale === 'hu' ? 'Törlés' : 'Delete',
    save: locale === 'hu' ? 'Mentés' : 'Save',
    cancel: locale === 'hu' ? 'Mégse' : 'Cancel',
    name: locale === 'hu' ? 'Település neve' : 'Settlement Name',
    zone: locale === 'hu' ? 'Szállítási zóna' : 'Delivery Zone',
    selectZone: locale === 'hu' ? 'Válassz zónát...' : 'Select zone...',
    zipCodes: locale === 'hu' ? 'Irányítószámok (vesszővel elválasztva)' : 'ZIP Codes (comma separated)',
    zipPlaceholder: locale === 'hu' ? 'pl. 2040, 2041' : 'e.g. 2040, 2041',
    active: locale === 'hu' ? 'Aktív' : 'Active',
    deliveryFee: locale === 'hu' ? 'Kiszállítási díj' : 'Delivery Fee',
    minOrder: locale === 'hu' ? 'Min. rendelés' : 'Min. Order',
    confirmDelete: locale === 'hu' ? 'Biztosan törlöd?' : 'Are you sure?',
    confirmDeleteDesc: locale === 'hu' 
      ? 'Ez a művelet nem vonható vissza. A település véglegesen törlődik.'
      : 'This action cannot be undone. The settlement will be permanently deleted.',
    createTitle: locale === 'hu' ? 'Új település hozzáadása' : 'Add New Settlement',
    editTitle: locale === 'hu' ? 'Település szerkesztése' : 'Edit Settlement',
    createDesc: locale === 'hu' 
      ? 'Add meg a település nevét, irányítószámait és válaszd ki a szállítási zónát.'
      : 'Enter the settlement name, ZIP codes and select the delivery zone.',
    saved: locale === 'hu' ? 'Mentve!' : 'Saved!',
    deleted: locale === 'hu' ? 'Törölve!' : 'Deleted!',
    error: locale === 'hu' ? 'Hiba történt' : 'An error occurred',
    free: locale === 'hu' ? 'Ingyenes' : 'Free',
    noSettlements: locale === 'hu' ? 'Még nincsenek települések.' : 'No settlements yet.',
  }

  const resetForm = () => {
    setFormData({
      name: '',
      zone_id: zones[0]?.id || '',
      zip_codes: '',
      is_active: true,
    })
  }

  const handleEdit = (settlement: DeliverySettlement) => {
    setEditingSettlement(settlement)
    setFormData({
      name: settlement.name,
      zone_id: settlement.zone_id,
      zip_codes: settlement.zip_codes.join(', '),
      is_active: settlement.is_active,
    })
  }

  const handleSave = async () => {
    if (!formData.name || !formData.zone_id || !formData.zip_codes) {
      toast.error(locale === 'hu' ? 'Töltsd ki az összes mezőt' : 'Please fill all fields')
      return
    }

    setIsSaving(true)
    const supabase = createClient()

    try {
      const zipCodesArray = formData.zip_codes
        .split(',')
        .map(z => z.trim())
        .filter(z => z.length > 0)

      const dataToSave = {
        name: formData.name,
        zone_id: formData.zone_id,
        zip_codes: zipCodesArray,
        is_active: formData.is_active,
      }

      if (editingSettlement) {
        const { error } = await supabase
          .from('delivery_settlements')
          .update(dataToSave)
          .eq('id', editingSettlement.id)
        
        if (error) throw error
        
        setSettlements(prev => 
          prev.map(s => s.id === editingSettlement.id ? { ...s, ...dataToSave } : s)
        )
      } else {
        const { data, error } = await supabase
          .from('delivery_settlements')
          .insert(dataToSave)
          .select()
          .single()
        
        if (error) throw error
        
        setSettlements(prev => [...prev, data])
      }

      toast.success(t.saved)
      setEditingSettlement(null)
      setIsCreating(false)
      resetForm()
      router.refresh()
    } catch (error) {
      console.error('Save error:', error)
      toast.error(t.error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteSettlement) return

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('delivery_settlements')
        .delete()
        .eq('id', deleteSettlement.id)
      
      if (error) throw error

      setSettlements(prev => prev.filter(s => s.id !== deleteSettlement.id))
      toast.success(t.deleted)
      setDeleteSettlement(null)
      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(t.error)
    }
  }

  const getZoneForSettlement = (settlement: DeliverySettlement) => {
    return zones.find(z => z.id === settlement.zone_id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t.title}</h2>
        <Button onClick={() => { resetForm(); setIsCreating(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          {t.addNew}
        </Button>
      </div>

      {settlements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t.noSettlements}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {settlements.map((settlement) => {
            const zone = getZoneForSettlement(settlement)
            return (
              <Card key={settlement.id} className={!settlement.is_active ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: zone?.color || '#ccc' }} 
                      />
                      <CardTitle className="text-lg">{settlement.name}</CardTitle>
                    </div>
                    {!settlement.is_active && (
                      <Badge variant="secondary">{locale === 'hu' ? 'Inaktív' : 'Inactive'}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {settlement.zip_codes.map((zip) => (
                      <Badge key={zip} variant="outline">{zip}</Badge>
                    ))}
                  </div>
                  
                  {zone && (
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <p>
                        {t.zone}: <span className="font-medium text-foreground">{getLocalizedName(zone, locale)}</span>
                      </p>
                      <p>
                        {t.deliveryFee}: <span className="font-medium text-foreground">
                          {zone.delivery_fee === 0 ? t.free : `${formatPrice(zone.delivery_fee)} Ft`}
                        </span>
                      </p>
                      <p>
                        {t.minOrder}: <span className="font-medium text-foreground">
                          {formatPrice(zone.min_order)} Ft
                        </span>
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(settlement)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      {t.edit}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteSettlement(settlement)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreating || !!editingSettlement} onOpenChange={(open) => {
        if (!open) {
          setIsCreating(false)
          setEditingSettlement(null)
          resetForm()
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSettlement ? t.editTitle : t.createTitle}</DialogTitle>
            <DialogDescription>{t.createDesc}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t.name}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Budaörs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zone">{t.zone}</Label>
              <Select value={formData.zone_id} onValueChange={(v) => setFormData({ ...formData, zone_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectZone} />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }} />
                        <span>{getLocalizedName(zone, locale)}</span>
                        <span className="text-muted-foreground text-sm">
                          ({zone.delivery_fee === 0 ? t.free : `${formatPrice(zone.delivery_fee)} Ft`})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip_codes">{t.zipCodes}</Label>
              <Input
                id="zip_codes"
                value={formData.zip_codes}
                onChange={(e) => setFormData({ ...formData, zip_codes: e.target.value })}
                placeholder={t.zipPlaceholder}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">{t.active}</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setIsCreating(false); setEditingSettlement(null); resetForm() }}>
              <X className="h-4 w-4 mr-1" />
              {t.cancel}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-1" />
              {t.save}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteSettlement} onOpenChange={(open) => !open && setDeleteSettlement(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>{t.confirmDeleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
