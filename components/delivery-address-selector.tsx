'use client'

import { useState, useEffect, useMemo } from 'react'
import { MapPin, AlertCircle, Check } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatPrice, getLocalizedName, type DeliveryZone } from '@/lib/types'
import type { Locale } from '@/lib/i18n/config'

interface DeliveryAddressSelectorProps {
  locale: Locale
  zones: DeliveryZone[]
  selectedZoneId: string
  selectedZip: string
  address: string
  onZoneChange: (zoneId: string) => void
  onZipChange: (zip: string) => void
  onAddressChange: (address: string) => void
  onSelectedZoneUpdate: (zone: DeliveryZone | null) => void
}

export function DeliveryAddressSelector({
  locale,
  zones,
  selectedZoneId,
  selectedZip,
  address,
  onZoneChange,
  onZipChange,
  onAddressChange,
  onSelectedZoneUpdate,
}: DeliveryAddressSelectorProps) {
  const [isOutOfZone, setIsOutOfZone] = useState(false)

  // Get active zones sorted by name
  const activeZones = useMemo(() => {
    return zones
      .filter(z => z.is_active && z.zip_codes && z.zip_codes.length > 0)
      .sort((a, b) => a.sort_order - b.sort_order)
  }, [zones])

  // Get the selected zone
  const selectedZone = useMemo(() => {
    return activeZones.find(z => z.id === selectedZoneId) || null
  }, [activeZones, selectedZoneId])

  // Get available ZIP codes for selected zone
  const availableZipCodes = useMemo(() => {
    if (!selectedZone || !selectedZone.zip_codes) return []
    return [...selectedZone.zip_codes].sort()
  }, [selectedZone])

  // When zone changes, auto-select the only ZIP. Guard against re-setting the
  // same value so an unstable onZipChange callback can't cause an update loop.
  useEffect(() => {
    if (selectedZone && availableZipCodes.length === 1 && selectedZip !== availableZipCodes[0]) {
      onZipChange(availableZipCodes[0])
    }
  }, [selectedZone, availableZipCodes, onZipChange, selectedZip])

  // Update parent when zone changes
  useEffect(() => {
    onSelectedZoneUpdate(selectedZone)
    if (selectedZone) {
      setIsOutOfZone(false)
    }
  }, [selectedZone, onSelectedZoneUpdate])

  // Try to find zone by ZIP code input
  const handleZipInput = (zip: string) => {
    onZipChange(zip)
    
    if (zip.length >= 4) {
      // Find zone that includes this ZIP
      const matchingZone = activeZones.find(z => 
        z.zip_codes && z.zip_codes.includes(zip)
      )
      
      if (matchingZone) {
        onZoneChange(matchingZone.id)
        setIsOutOfZone(false)
      } else {
        setIsOutOfZone(true)
        onSelectedZoneUpdate(null)
      }
    } else {
      setIsOutOfZone(false)
    }
  }

  const t = {
    zone: locale === 'hu' ? 'Kiszállítási terület' : 'Delivery Area',
    selectZone: locale === 'hu' ? 'Válassz területet...' : 'Select area...',
    zipCode: locale === 'hu' ? 'Irányítószám' : 'ZIP Code',
    selectZip: locale === 'hu' ? 'Válassz...' : 'Select...',
    enterZip: locale === 'hu' ? 'Írd be az irányítószámot' : 'Enter ZIP code',
    address: locale === 'hu' ? 'Utca, házszám' : 'Street, house number',
    addressPlaceholder: locale === 'hu' ? 'Pl. Fő utca 12.' : 'e.g. Main Street 12',
    deliveryFee: locale === 'hu' ? 'Kiszállítási díj' : 'Delivery fee',
    minOrder: locale === 'hu' ? 'Min. rendelés' : 'Min. order',
    deliveryTime: locale === 'hu' ? 'Szállítási idő' : 'Delivery time',
    free: locale === 'hu' ? 'Ingyenes' : 'Free',
    minutes: locale === 'hu' ? 'perc' : 'min',
    outOfZone: locale === 'hu' 
      ? 'Sajnos erre a címre nem szállítunk. Kérjük válassz másik területet.'
      : 'Sorry, we do not deliver to this address. Please select another area.',
    deliveryInfo: locale === 'hu' ? 'Kiszállítási információ' : 'Delivery info',
  }

  return (
    <div className="space-y-4">
      {/* Zone Selection */}
      <div className="space-y-2">
        <Label htmlFor="zone">{t.zone} *</Label>
        <Select value={selectedZoneId} onValueChange={onZoneChange}>
          <SelectTrigger id="zone">
            <SelectValue placeholder={t.selectZone} />
          </SelectTrigger>
          <SelectContent>
            {activeZones.map((zone) => (
              <SelectItem key={zone.id} value={zone.id}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: zone.color }}
                  />
                  <span>{getLocalizedName(zone, locale)}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({zone.delivery_fee === 0 
                      ? t.free 
                      : `${formatPrice(zone.delivery_fee)} Ft`})
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ZIP Code Selection */}
      <div className="space-y-2">
        <Label htmlFor="zip">{t.zipCode} *</Label>
        {selectedZone && availableZipCodes.length > 1 ? (
          <Select value={selectedZip} onValueChange={onZipChange}>
            <SelectTrigger id="zip">
              <SelectValue placeholder={t.selectZip} />
            </SelectTrigger>
            <SelectContent>
              {availableZipCodes.map((zip) => (
                <SelectItem key={zip} value={zip}>
                  {zip}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="zip"
            value={selectedZip}
            onChange={(e) => handleZipInput(e.target.value)}
            placeholder={availableZipCodes.length === 1 ? availableZipCodes[0] : t.enterZip}
            maxLength={5}
          />
        )}
      </div>

      {/* Street Address */}
      <div className="space-y-2">
        <Label htmlFor="address">{t.address} *</Label>
        <Input
          id="address"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder={t.addressPlaceholder}
        />
      </div>

      {/* Out of Zone Warning */}
      {isOutOfZone && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t.outOfZone}</AlertDescription>
        </Alert>
      )}

      {/* Delivery Info Card */}
      {selectedZone && !isOutOfZone && (
        <div 
          className="p-4 rounded-lg border-2 bg-muted/30"
          style={{ borderColor: selectedZone.color }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: selectedZone.color }} 
            />
            <span className="font-medium text-sm">{t.deliveryInfo}</span>
            <Check className="h-4 w-4 text-green-500 ml-auto" />
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">{t.deliveryFee}:</span>
              <p className="font-semibold text-primary">
                {selectedZone.delivery_fee === 0 
                  ? t.free 
                  : `${formatPrice(selectedZone.delivery_fee)} Ft`}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">{t.minOrder}:</span>
              <p className="font-semibold">
                {formatPrice(selectedZone.min_order)} Ft
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">{t.deliveryTime}:</span>
              <p className="font-semibold">
                {selectedZone.delivery_time_min}-{selectedZone.delivery_time_max} {t.minutes}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
