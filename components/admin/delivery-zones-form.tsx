'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Save, MapPin, X } from 'lucide-react'
import { formatPrice, type DeliveryZone } from '@/lib/types'

interface DeliveryZonesFormProps {
  locale: string
  initialZones: DeliveryZone[]
}

const colorOptions = [
  { value: '#4CAF50', label: 'Green' },
  { value: '#FFC107', label: 'Yellow' },
  { value: '#FF9800', label: 'Orange' },
  { value: '#F44336', label: 'Red' },
  { value: '#E91E63', label: 'Pink' },
  { value: '#9C27B0', label: 'Purple' },
  { value: '#2196F3', label: 'Blue' },
]

export function DeliveryZonesForm({ locale, initialZones }: DeliveryZonesFormProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [zones, setZones] = useState<DeliveryZone[]>(initialZones)
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deleteZone, setDeleteZone] = useState<DeliveryZone | null>(null)
  const [newZipCode, setNewZipCode] = useState('')
  
  const [formData, setFormData] = useState({
    name_hu: '',
    name_en: '',
    color: '#4CAF50',
    min_order: 3000,
    delivery_fee: 500,
    delivery_time_min: 30,
    delivery_time_max: 60,
    zip_codes: [] as string[],
    is_active: true,
  })
  
  const t = {
    title: locale === 'hu' ? 'Kiszállítási zónák' : 'Delivery Zones',
    description: locale === 'hu' 
      ? 'Add meg a kiszállítási területeket, irányítószámokat és díjakat' 
      : 'Manage delivery areas, ZIP codes and fees',
    addZone: locale === 'hu' ? 'Új zóna' : 'Add Zone',
    editZone: locale === 'hu' ? 'Zóna szerkesztése' : 'Edit Zone',
    createZone: locale === 'hu' ? 'Új zóna létrehozása' : 'Create New Zone',
    nameHu: locale === 'hu' ? 'Név (magyar)' : 'Name (Hungarian)',
    nameEn: locale === 'hu' ? 'Név (angol)' : 'Name (English)',
    color: locale === 'hu' ? 'Szín' : 'Color',
    minOrder: locale === 'hu' ? 'Min. rendelés (Ft)' : 'Min. order (Ft)',
    deliveryFee: locale === 'hu' ? 'Szállítási díj (Ft)' : 'Delivery fee (Ft)',
    deliveryTimeMin: locale === 'hu' ? 'Min. idő (perc)' : 'Min. time (min)',
    deliveryTimeMax: locale === 'hu' ? 'Max. idő (perc)' : 'Max. time (min)',
    zipCodes: locale === 'hu' ? 'Irányítószámok' : 'ZIP Codes',
    addZipCode: locale === 'hu' ? 'Irányítószám hozzáadása' : 'Add ZIP code',
    zipPlaceholder: locale === 'hu' ? 'pl. 2040' : 'e.g. 2040',
    active: locale === 'hu' ? 'Aktív' : 'Active',
    save: locale === 'hu' ? 'Mentés' : 'Save',
    cancel: locale === 'hu' ? 'Mégse' : 'Cancel',
    delete: locale === 'hu' ? 'Törlés' : 'Delete',
    deleteConfirm: locale === 'hu' 
      ? 'Biztosan törölni szeretnéd ezt a zónát?' 
      : 'Are you sure you want to delete this zone?',
    deleteWarning: locale === 'hu'
      ? 'Ez a művelet nem visszavonható.'
      : 'This action cannot be undone.',
    saved: locale === 'hu' ? 'Zóna mentve!' : 'Zone saved!',
    deleted: locale === 'hu' ? 'Zóna törölve!' : 'Zone deleted!',
    error: locale === 'hu' ? 'Hiba történt' : 'Error occurred',
    zone: locale === 'hu' ? 'Zóna' : 'Zone',
    fee: locale === 'hu' ? 'Díj' : 'Fee',
    time: locale === 'hu' ? 'Idő' : 'Time',
    status: locale === 'hu' ? 'Státusz' : 'Status',
    actions: locale === 'hu' ? 'Műveletek' : 'Actions',
    free: locale === 'hu' ? 'Ingyenes' : 'Free',
    minutes: locale === 'hu' ? 'perc' : 'min',
    noZipCodes: locale === 'hu' ? 'Nincs irányítószám' : 'No ZIP codes',
  }

  const resetForm = () => {
    setFormData({
      name_hu: '',
      name_en: '',
      color: '#4CAF50',
      min_order: 3000,
      delivery_fee: 500,
      delivery_time_min: 30,
      delivery_time_max: 60,
      zip_codes: [],
      is_active: true,
    })
    setNewZipCode('')
  }

  const handleEdit = (zone: DeliveryZone) => {
    setEditingZone(zone)
    setFormData({
      name_hu: zone.name_hu,
      name_en: zone.name_en,
      color: zone.color,
      min_order: zone.min_order,
      delivery_fee: zone.delivery_fee,
      delivery_time_min: zone.delivery_time_min,
      delivery_time_max: zone.delivery_time_max,
      zip_codes: zone.zip_codes || [],
      is_active: zone.is_active,
    })
    setIsCreating(false)
    setNewZipCode('')
  }

  const handleCreate = () => {
    resetForm()
    setEditingZone(null)
    setIsCreating(true)
  }

  const handleAddZipCode = () => {
    const zip = newZipCode.trim()
    if (zip && !formData.zip_codes.includes(zip)) {
      setFormData({ ...formData, zip_codes: [...formData.zip_codes, zip].sort() })
      setNewZipCode('')
    }
  }

  const handleRemoveZipCode = (zipToRemove: string) => {
    setFormData({
      ...formData,
      zip_codes: formData.zip_codes.filter(zip => zip !== zipToRemove)
    })
  }

  const handleSave = async () => {
    if (!formData.name_hu || !formData.name_en) {
      toast.error(locale === 'hu' ? 'Add meg a zóna nevét mindkét nyelven' : 'Enter zone name in both languages')
      return
    }

    setIsSaving(true)

    try {
      if (editingZone) {
        // Update existing zone
        const { error } = await supabase
          .from('delivery_zones')
          .update({
            name_hu: formData.name_hu,
            name_en: formData.name_en,
            color: formData.color,
            min_order: formData.min_order,
            delivery_fee: formData.delivery_fee,
            delivery_time_min: formData.delivery_time_min,
            delivery_time_max: formData.delivery_time_max,
            zip_codes: formData.zip_codes,
            is_active: formData.is_active,
          })
          .eq('id', editingZone.id)

        if (error) throw error

        // Update local state
        setZones(zones.map(z => 
          z.id === editingZone.id 
            ? { ...z, ...formData }
            : z
        ))
      } else {
        // Create new zone
        const { data, error } = await supabase
          .from('delivery_zones')
          .insert({
            name_hu: formData.name_hu,
            name_en: formData.name_en,
            color: formData.color,
            min_order: formData.min_order,
            delivery_fee: formData.delivery_fee,
            delivery_time_min: formData.delivery_time_min,
            delivery_time_max: formData.delivery_time_max,
            zip_codes: formData.zip_codes,
            is_active: formData.is_active,
            polygon: '[]',
            sort_order: zones.length,
          })
          .select()
          .single()

        if (error) throw error

        if (data) {
          setZones([...zones, data as DeliveryZone])
        }
      }

      toast.success(t.saved)
      setEditingZone(null)
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
    if (!deleteZone) return

    try {
      const { error } = await supabase
        .from('delivery_zones')
        .delete()
        .eq('id', deleteZone.id)

      if (error) throw error

      setZones(zones.filter(z => z.id !== deleteZone.id))
      toast.success(t.deleted)
      setDeleteZone(null)
      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(t.error)
    }
  }

  const handleToggleActive = async (zone: DeliveryZone) => {
    try {
      const { error } = await supabase
        .from('delivery_zones')
        .update({ is_active: !zone.is_active })
        .eq('id', zone.id)

      if (error) throw error

      setZones(zones.map(z => 
        z.id === zone.id ? { ...z, is_active: !z.is_active } : z
      ))
      router.refresh()
    } catch (error) {
      console.error('Toggle error:', error)
      toast.error(t.error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t.title}
            </CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t.addZone}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Zones Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.zone}</TableHead>
                <TableHead>{t.zipCodes}</TableHead>
                <TableHead>{t.minOrder}</TableHead>
                <TableHead>{t.fee}</TableHead>
                <TableHead>{t.time}</TableHead>
                <TableHead>{t.status}</TableHead>
                <TableHead className="text-right">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {zones.map((zone) => (
                <TableRow key={zone.id} className={!zone.is_active ? 'opacity-50' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: zone.color }}
                      />
                      <span className="font-medium">
                        {locale === 'hu' ? zone.name_hu : zone.name_en}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {zone.zip_codes && zone.zip_codes.length > 0 ? (
                        zone.zip_codes.slice(0, 3).map((zip) => (
                          <Badge key={zip} variant="secondary" className="text-xs">
                            {zip}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-xs">{t.noZipCodes}</span>
                      )}
                      {zone.zip_codes && zone.zip_codes.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{zone.zip_codes.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatPrice(zone.min_order)} Ft</TableCell>
                  <TableCell>
                    {zone.delivery_fee === 0 
                      ? <span className="text-green-600 font-medium">{t.free}</span>
                      : `${formatPrice(zone.delivery_fee)} Ft`
                    }
                  </TableCell>
                  <TableCell>{zone.delivery_time_min}-{zone.delivery_time_max} {t.minutes}</TableCell>
                  <TableCell>
                    <Switch
                      checked={zone.is_active}
                      onCheckedChange={() => handleToggleActive(zone)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(zone)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteZone(zone)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {zones.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {locale === 'hu' ? 'Nincsenek zónák' : 'No zones yet'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Edit/Create Dialog */}
        <Dialog open={isCreating || !!editingZone} onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false)
            setEditingZone(null)
            resetForm()
          }
        }}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingZone ? t.editZone : t.createZone}
              </DialogTitle>
              <DialogDescription>
                {locale === 'hu' 
                  ? 'Add meg a zóna adatait, irányítószámokat és a kiszállítási feltételeket'
                  : 'Enter zone details, ZIP codes and delivery conditions'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name_hu">{t.nameHu}</Label>
                  <Input
                    id="name_hu"
                    value={formData.name_hu}
                    onChange={(e) => setFormData({ ...formData, name_hu: e.target.value })}
                    placeholder="pl. Budaörs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_en">{t.nameEn}</Label>
                  <Input
                    id="name_en"
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    placeholder="e.g. Budaörs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.color}</Label>
                <div className="flex gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color.value 
                          ? 'border-foreground scale-110' 
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                    />
                  ))}
                </div>
              </div>

              {/* ZIP Codes Section */}
              <div className="space-y-2">
                <Label>{t.zipCodes}</Label>
                <div className="flex gap-2">
                  <Input
                    value={newZipCode}
                    onChange={(e) => setNewZipCode(e.target.value)}
                    placeholder={t.zipPlaceholder}
                    maxLength={5}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddZipCode()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddZipCode}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.zip_codes.map((zip) => (
                    <Badge key={zip} variant="secondary" className="gap-1">
                      {zip}
                      <button
                        type="button"
                        onClick={() => handleRemoveZipCode(zip)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {formData.zip_codes.length === 0 && (
                    <span className="text-muted-foreground text-sm">{t.noZipCodes}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_order">{t.minOrder}</Label>
                  <Input
                    id="min_order"
                    type="number"
                    value={formData.min_order}
                    onChange={(e) => setFormData({ ...formData, min_order: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery_fee">{t.deliveryFee}</Label>
                  <Input
                    id="delivery_fee"
                    type="number"
                    value={formData.delivery_fee}
                    onChange={(e) => setFormData({ ...formData, delivery_fee: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery_time_min">{t.deliveryTimeMin}</Label>
                  <Input
                    id="delivery_time_min"
                    type="number"
                    value={formData.delivery_time_min}
                    onChange={(e) => setFormData({ ...formData, delivery_time_min: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery_time_max">{t.deliveryTimeMax}</Label>
                  <Input
                    id="delivery_time_max"
                    type="number"
                    value={formData.delivery_time_max}
                    onChange={(e) => setFormData({ ...formData, delivery_time_max: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">{t.active}</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsCreating(false)
                setEditingZone(null)
                resetForm()
              }}>
                {t.cancel}
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {t.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteZone} onOpenChange={(open) => !open && setDeleteZone(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.deleteConfirm}</DialogTitle>
              <DialogDescription>{t.deleteWarning}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteZone(null)}>
                {t.cancel}
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                {t.delete}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
