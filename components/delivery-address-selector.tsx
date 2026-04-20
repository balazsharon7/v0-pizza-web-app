'use client'

import { useState, useEffect, useMemo } from 'react'
import { MapPin, AlertCircle, Check } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatPrice, type DeliveryZone, type DeliverySettlement } from '@/lib/types'
import type { Locale } from '@/lib/i18n/config'

interface DeliveryAddressSelectorProps {
  locale: Locale
  settlements: DeliverySettlement[]
  zones: DeliveryZone[]
  selectedSettlementId: string
  selectedZip: string
  address: string
  onSettlementChange: (settlementId: string) => void
  onZipChange: (zip: string) => void
  onAddressChange: (address: string) => void
  onZoneChange: (zone: DeliveryZone | null) => void
}

export function DeliveryAddressSelector({
  locale,
  settlements,
  zones,
  selectedSettlementId,
  selectedZip,
  address,
  onSettlementChange,
  onZipChange,
  onAddressChange,
  onZoneChange,
}: DeliveryAddressSelectorProps) {
  const [isOutOfZone, setIsOutOfZone] = useState(false)

  // Get unique settlement names with their zones
  const settlementOptions = useMemo(() => {
    return settlements
      .filter(s => s.is_active)
      .map(settlement => {
        const zone = zones.find(z => z.id === settlement.zone_id)
        return {
          ...settlement,
          zone,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'hu'))
  }, [settlements, zones])

  // Get the selected settlement
  const selectedSettlement = useMemo(() => {
    return settlementOptions.find(s => s.id === selectedSettlementId)
  }, [settlementOptions, selectedSettlementId])

  // Get available ZIP codes for selected settlement
  const availableZipCodes = useMemo(() => {
    if (!selectedSettlement) return []
    return selectedSettlement.zip_codes.sort()
  }, [selectedSettlement])

  // When settlement changes, auto-select first ZIP if only one
  useEffect(() => {
    if (selectedSettlement && availableZipCodes.length === 1) {
      onZipChange(availableZipCodes[0])
    }
  }, [selectedSettlement, availableZipCodes, onZipChange])

  // Update zone when settlement or ZIP changes
  useEffect(() => {
    if (selectedSettlement?.zone) {
      onZoneChange(selectedSettlement.zone)
      setIsOutOfZone(false)
    } else if (selectedSettlementId && !selectedSettlement) {
      onZoneChange(null)
      setIsOutOfZone(true)
    }
  }, [selectedSettlement, selectedSettlementId, onZoneChange])

  // Try to find settlement by ZIP code input
  const handleZipInput = (zip: string) => {
    onZipChange(zip)
    
    if (zip.length >= 4) {
      // Find settlement that includes this ZIP
      const matchingSettlement = settlementOptions.find(s => 
        s.zip_codes.includes(zip)
      )
      
      if (matchingSettlement) {
        onSettlementChange(matchingSettlement.id)
        setIsOutOfZone(false)
      } else {
        setIsOutOfZone(true)
        onZoneChange(null)
      }
    }
  }

  const t = {
    settlement: locale === 'hu' ? 'Település' : 'Settlement',
    selectSettlement: locale === 'hu' ? 'Válassz települést...' : 'Select settlement...',
    zipCode: locale === 'hu' ? 'Irányítószám' : 'ZIP Code',
    selectZip: locale === 'hu' ? 'Válassz...' : 'Select...',
    enterZip: locale === 'hu' ? 'Írd be az irányítószámot' : 'Enter ZIP code',
    address: locale === 'hu' ? 'Utca, házszám' : 'Street, house number',
    addressPlaceholder: locale === 'hu' ? 'Pl. Fő utca 12.' : 'e.g. Main Street 12',
    deliveryFee: locale === 'hu' ? 'Kiszállítási díj' : 'Delivery fee',
    minOrder: locale === 'hu' ? 'Min. rendelés' : 'Min. order',
    free: locale === 'hu' ? 'Ingyenes' : 'Free',
    outOfZone: locale === 'hu' 
      ? 'Sajnos erre a címre nem szállítunk. Kérjük válassz másik települést.'
      : 'Sorry, we do not deliver to this address. Please select another settlement.',
    deliveryInfo: locale === 'hu' ? 'Kiszállítási információ' : 'Delivery info',
  }

  return (
    <div className="space-y-4">
      {/* Settlement Selection */}
      <div className="space-y-2">
        <Label htmlFor="settlement">{t.settlement} *</Label>
        <Select value={selectedSettlementId} onValueChange={onSettlementChange}>
          <SelectTrigger id="settlement">
            <SelectValue placeholder={t.selectSettlement} />
          </SelectTrigger>
          <SelectContent>
            {settlementOptions.map((settlement) => (
              <SelectItem key={settlement.id} value={settlement.id}>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{settlement.name}</span>
                  {settlement.zone && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({settlement.zone.delivery_fee === 0 
                        ? t.free 
                        : `${formatPrice(settlement.zone.delivery_fee)} Ft`})
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ZIP Code Selection */}
      <div className="space-y-2">
        <Label htmlFor="zip">{t.zipCode} *</Label>
        {availableZipCodes.length > 1 ? (
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
      {selectedSettlement?.zone && !isOutOfZone && (
        <div 
          className="p-4 rounded-lg border-2 bg-muted/30"
          style={{ borderColor: selectedSettlement.zone.color }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: selectedSettlement.zone.color }} 
            />
            <span className="font-medium text-sm">{t.deliveryInfo}</span>
            <Check className="h-4 w-4 text-green-500 ml-auto" />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">{t.deliveryFee}:</span>
              <p className="font-semibold text-primary">
                {selectedSettlement.zone.delivery_fee === 0 
                  ? t.free 
                  : `${formatPrice(selectedSettlement.zone.delivery_fee)} Ft`}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">{t.minOrder}:</span>
              <p className="font-semibold">
                {formatPrice(selectedSettlement.zone.min_order)} Ft
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
