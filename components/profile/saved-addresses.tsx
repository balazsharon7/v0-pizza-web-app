'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MapPin, Plus, Pencil, Trash2, Star, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DeliveryAddressSelector } from '@/components/delivery-address-selector'
import { createClient } from '@/lib/supabase/client'
import { getLocalizedName, type DeliveryZone, type SavedAddress } from '@/lib/types'
import type { Locale } from '@/lib/i18n/config'

interface SavedAddressesProps {
  userId: string
  zones: DeliveryZone[]
  initialAddresses: SavedAddress[]
  locale: Locale
}

const emptyForm = { label: '', zoneId: '', zip: '', street: '' }

export function SavedAddresses({ userId, zones, initialAddresses, locale }: SavedAddressesProps) {
  const router = useRouter()
  const supabase = createClient()
  const isHu = locale === 'hu'

  const [addresses, setAddresses] = useState<SavedAddress[]>(initialAddresses)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<SavedAddress | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Stable callbacks — passing fresh arrow functions to DeliveryAddressSelector
  // makes its auto-select-ZIP effect loop forever on single-ZIP zones.
  const handleZoneChange = useCallback((zoneId: string) => setForm((f) => ({ ...f, zoneId })), [])
  const handleZipChange = useCallback((zip: string) => setForm((f) => ({ ...f, zip })), [])
  const handleStreetChange = useCallback((street: string) => setForm((f) => ({ ...f, street })), [])

  const zoneName = (zoneId: string | null) => {
    const z = zones.find((zz) => zz.id === zoneId)
    return z ? getLocalizedName(z, locale) : isHu ? 'Zónán kívül' : 'Out of zone'
  }

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setSelectedZone(null)
    setDialogOpen(true)
  }

  const openEdit = (a: SavedAddress) => {
    setEditing(a)
    setForm({ label: a.label, zoneId: a.zone_id ?? '', zip: a.zip, street: a.street_address })
    setSelectedZone(zones.find((z) => z.id === a.zone_id) ?? null)
    setDialogOpen(true)
  }

  const refresh = async () => {
    const { data } = await supabase
      .from('saved_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    setAddresses((data ?? []) as SavedAddress[])
  }

  const handleSave = async () => {
    if (!form.label.trim()) {
      toast.error(isHu ? 'Adj nevet a címnek (pl. Otthon)' : 'Name the address (e.g. Home)')
      return
    }
    if (!selectedZone || !form.zoneId || !form.zip || !form.street.trim()) {
      toast.error(isHu ? 'Válassz kiszállítási zónát és add meg a címet' : 'Pick a delivery zone and enter the address')
      return
    }

    setIsSaving(true)
    try {
      const makeDefault = editing ? editing.is_default : addresses.length === 0
      const payload = {
        user_id: userId,
        label: form.label.trim(),
        zone_id: form.zoneId,
        zip: form.zip,
        street_address: form.street.trim(),
        is_default: makeDefault,
      }

      if (editing) {
        const { error } = await supabase.from('saved_addresses').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('saved_addresses').insert(payload)
        if (error) throw error
      }

      await refresh()
      setDialogOpen(false)
      toast.success(isHu ? 'Cím mentve!' : 'Address saved!')
      router.refresh()
    } catch {
      toast.error(isHu ? 'Hiba a mentés során' : 'Error saving address')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('saved_addresses').delete().eq('id', id)
      if (error) throw error
      await refresh()
      toast.success(isHu ? 'Cím törölve' : 'Address deleted')
      router.refresh()
    } catch {
      toast.error(isHu ? 'Hiba történt' : 'Error occurred')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await supabase.from('saved_addresses').update({ is_default: false }).eq('user_id', userId)
      const { error } = await supabase.from('saved_addresses').update({ is_default: true }).eq('id', id)
      if (error) throw error
      await refresh()
      router.refresh()
    } catch {
      toast.error(isHu ? 'Hiba történt' : 'Error occurred')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {isHu ? 'Mentett címeim' : 'My saved addresses'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isHu
              ? 'Csak kiszállítási zónán belüli címeket adhatsz meg. Rendeléskor egy kattintással kiválaszthatod.'
              : 'Only addresses within a delivery zone can be saved. Pick one with a click at checkout.'}
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          {isHu ? 'Új cím' : 'New address'}
        </Button>
      </div>

      {addresses.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <Home className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>{isHu ? 'Még nincs mentett címed' : 'No saved addresses yet'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <Card key={a.id} className={a.is_default ? 'border-primary' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{a.label}</span>
                      {a.is_default && (
                        <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
                          <Star className="h-3 w-3" />
                          {isHu ? 'Alapértelmezett' : 'Default'}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm">{a.street_address}</p>
                    <p className="text-sm text-muted-foreground">
                      {a.zip} · {zoneName(a.zone_id)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(a.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {!a.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => handleSetDefault(a.id)}
                  >
                    <Star className="h-4 w-4 mr-1.5" />
                    {isHu ? 'Beállítás alapértelmezettként' : 'Set as default'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? (isHu ? 'Cím szerkesztése' : 'Edit address') : isHu ? 'Új cím' : 'New address'}
            </DialogTitle>
            <DialogDescription>
              {isHu ? 'Csak kiszállítási zónán belüli cím menthető.' : 'Only an address within a delivery zone can be saved.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="addr-label">{isHu ? 'Cím neve' : 'Address name'} *</Label>
              <Input
                id="addr-label"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder={isHu ? 'pl. Otthon, Munkahely' : 'e.g. Home, Work'}
              />
            </div>

            <DeliveryAddressSelector
              locale={locale}
              zones={zones}
              selectedZoneId={form.zoneId}
              selectedZip={form.zip}
              address={form.street}
              onZoneChange={handleZoneChange}
              onZipChange={handleZipChange}
              onAddressChange={handleStreetChange}
              onSelectedZoneUpdate={setSelectedZone}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {isHu ? 'Mégse' : 'Cancel'}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (isHu ? 'Mentés...' : 'Saving...') : isHu ? 'Mentés' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
