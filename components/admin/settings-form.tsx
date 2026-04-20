'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Clock, Store, Save, Power, MapPin } from 'lucide-react'
import { updateSettings } from '@/app/actions/admin'
import { DeliveryZonesForm } from './delivery-zones-form'
import type { DeliveryZone } from '@/lib/types'

type OpeningHours = {
  [key: string]: { open: string; close: string; closed?: boolean }
}

type StoreInfo = {
  name_hu: string
  name_en: string
  address: string
  phone: string
  email: string
}



interface SettingsFormProps {
  locale: string
  deliveryZones?: DeliveryZone[]
}

const dayNames: Record<string, { hu: string; en: string }> = {
  monday: { hu: 'Hétfő', en: 'Monday' },
  tuesday: { hu: 'Kedd', en: 'Tuesday' },
  wednesday: { hu: 'Szerda', en: 'Wednesday' },
  thursday: { hu: 'Csütörtök', en: 'Thursday' },
  friday: { hu: 'Péntek', en: 'Friday' },
  saturday: { hu: 'Szombat', en: 'Saturday' },
  sunday: { hu: 'Vasárnap', en: 'Sunday' },
}

const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export function SettingsForm({ locale, deliveryZones = [] }: SettingsFormProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const [isOpen, setIsOpen] = useState(true)
  const [openingHours, setOpeningHours] = useState<OpeningHours>({})
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    name_hu: '',
    name_en: '',
    address: '',
    phone: '',
    email: '',
  })

  
  const t = {
    title: locale === 'hu' ? 'Beállítások' : 'Settings',
    storeStatus: locale === 'hu' ? 'Étterem állapota' : 'Store Status',
    storeOpen: locale === 'hu' ? 'Étterem nyitva' : 'Store Open',
    storeOpenDesc: locale === 'hu' ? 'Ha kikapcsolod, az étterem zárva lesz függetlenül a nyitvatartástól' : 'If disabled, the store will be closed regardless of opening hours',
    openingHours: locale === 'hu' ? 'Nyitvatartás' : 'Opening Hours',
    openingHoursDesc: locale === 'hu' ? 'Add meg a heti nyitvatartási időket' : 'Set your weekly opening hours',
    storeInfo: locale === 'hu' ? 'Üzlet adatok' : 'Store Information',
    storeInfoDesc: locale === 'hu' ? 'Az étterem alapadatai' : 'Basic restaurant information',
    namHu: locale === 'hu' ? 'Név (magyar)' : 'Name (Hungarian)',
    nameEn: locale === 'hu' ? 'Név (angol)' : 'Name (English)',
    address: locale === 'hu' ? 'Cím' : 'Address',
    phone: locale === 'hu' ? 'Telefon' : 'Phone',
    email: locale === 'hu' ? 'Email' : 'Email',
    open: locale === 'hu' ? 'Nyitás' : 'Open',
    close: locale === 'hu' ? 'Zárás' : 'Close',
    closed: locale === 'hu' ? 'Zárva' : 'Closed',
    save: locale === 'hu' ? 'Mentés' : 'Save',
    saving: locale === 'hu' ? 'Mentés...' : 'Saving...',
    saved: locale === 'hu' ? 'Beállítások mentve!' : 'Settings saved!',
    error: locale === 'hu' ? 'Hiba történt a mentés során' : 'Error saving settings',
  }
  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: settings } = await supabase
          .from('settings')
          .select('key, value')
        
        if (settings) {
          settings.forEach((setting) => {
            switch (setting.key) {
              case 'is_open':
                setIsOpen((setting.value as { value: boolean }).value)
                break
              case 'opening_hours':
                setOpeningHours(setting.value as OpeningHours)
                break
              case 'store_info':
                setStoreInfo(setting.value as StoreInfo)
                break
            }
          })
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchSettings()
  }, [supabase])
  
  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      // Update all settings using server actions
      const result1 = await updateSettings('is_open', { value: isOpen })
      if (!result1.success) throw new Error(result1.error)
      
      const result2 = await updateSettings('opening_hours', openingHours)
      if (!result2.success) throw new Error(result2.error)
      
      const result3 = await updateSettings('store_info', storeInfo)
      if (!result3.success) throw new Error(result3.error)
      
      toast.success(t.saved)
      router.refresh()
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error(t.error)
    } finally {
      setIsSaving(false)
    }
  }
  
  const updateOpeningHours = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }))
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Power className="h-4 w-4" />
            <span className="hidden sm:inline">{t.storeStatus}</span>
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">{t.openingHours}</span>
          </TabsTrigger>
          <TabsTrigger value="store" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">{t.storeInfo}</span>
          </TabsTrigger>
          <TabsTrigger value="zones" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">{locale === 'hu' ? 'Zónák' : 'Zones'}</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="status" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Power className="h-5 w-5" />
                {t.storeStatus}
              </CardTitle>
              <CardDescription>{t.storeOpenDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="is-open" className="text-base font-medium">
                    {t.storeOpen}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {isOpen 
                      ? (locale === 'hu' ? 'Az étterem jelenleg fogad rendeléseket' : 'The store is currently accepting orders')
                      : (locale === 'hu' ? 'Az étterem jelenleg nem fogad rendeléseket' : 'The store is not accepting orders')
                    }
                  </p>
                </div>
                <Switch
                  id="is-open"
                  checked={isOpen}
                  onCheckedChange={setIsOpen}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="hours" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t.openingHours}
              </CardTitle>
              <CardDescription>{t.openingHoursDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dayOrder.map((day) => {
                  const hours = openingHours[day] || { open: '11:00', close: '22:00', closed: false }
                  return (
                    <div key={day} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="w-28 font-medium">
                        {dayNames[day][locale as 'hu' | 'en']}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!hours.closed}
                          onCheckedChange={(checked) => updateOpeningHours(day, 'closed', !checked)}
                        />
                        <span className="text-sm text-muted-foreground w-16">
                          {hours.closed ? t.closed : (locale === 'hu' ? 'Nyitva' : 'Open')}
                        </span>
                      </div>
                      {!hours.closed && (
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm text-muted-foreground">{t.open}</Label>
                            <Input
                              type="time"
                              value={hours.open}
                              onChange={(e) => updateOpeningHours(day, 'open', e.target.value)}
                              className="w-32"
                            />
                          </div>
                          <span className="text-muted-foreground">-</span>
                          <div className="flex items-center gap-2">
                            <Label className="text-sm text-muted-foreground">{t.close}</Label>
                            <Input
                              type="time"
                              value={hours.close}
                              onChange={(e) => updateOpeningHours(day, 'close', e.target.value)}
                              className="w-32"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="store" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                {t.storeInfo}
              </CardTitle>
              <CardDescription>{t.storeInfoDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name-hu">{t.namHu}</Label>
                  <Input
                    id="name-hu"
                    value={storeInfo.name_hu}
                    onChange={(e) => setStoreInfo({ ...storeInfo, name_hu: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name-en">{t.nameEn}</Label>
                  <Input
                    id="name-en"
                    value={storeInfo.name_en}
                    onChange={(e) => setStoreInfo({ ...storeInfo, name_en: e.target.value })}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">{t.address}</Label>
                  <Input
                    id="address"
                    value={storeInfo.address}
                    onChange={(e) => setStoreInfo({ ...storeInfo, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t.phone}</Label>
                  <Input
                    id="phone"
                    value={storeInfo.phone}
                    onChange={(e) => setStoreInfo({ ...storeInfo, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={storeInfo.email}
                    onChange={(e) => setStoreInfo({ ...storeInfo, email: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="zones" className="mt-6">
          <DeliveryZonesForm locale={locale} initialZones={deliveryZones} />
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? t.saving : t.save}
        </Button>
      </div>
    </div>
  )
}
