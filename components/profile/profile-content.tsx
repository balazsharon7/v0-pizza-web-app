'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { User as UserIcon, Package, Settings, LogOut, MapPin, Phone, Mail, Clock } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/get-dictionary'

interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  default_address: string | null
  default_city: string | null
  default_zip: string | null
  is_admin: boolean
}

interface OrderItem {
  id: string
  quantity: number
  unit_price: number
  total_price: number
  product: { name_hu: string; name_en: string } | null
  size: { name_hu: string; name_en: string } | null
}

interface Order {
  id: string
  order_number: string
  status: string
  delivery_type: string
  total: number
  created_at: string
  order_items: OrderItem[]
}

interface ProfileContentProps {
  user: User
  profile: Profile | null
  orders: Order[]
  locale: Locale
  t: Dictionary
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  preparing: 'bg-orange-500',
  ready: 'bg-green-500',
  delivering: 'bg-purple-500',
  completed: 'bg-green-700',
  cancelled: 'bg-red-500',
}

const statusLabels: Record<string, Record<Locale, string>> = {
  pending: { hu: 'Függőben', en: 'Pending' },
  confirmed: { hu: 'Visszaigazolva', en: 'Confirmed' },
  preparing: { hu: 'Készítés alatt', en: 'Preparing' },
  ready: { hu: 'Kész', en: 'Ready' },
  delivering: { hu: 'Kiszállítás alatt', en: 'Delivering' },
  completed: { hu: 'Teljesítve', en: 'Completed' },
  cancelled: { hu: 'Törölve', en: 'Cancelled' },
}

export function ProfileContent({ user, profile, orders, locale, t }: ProfileContentProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    phone: profile?.phone || '',
    defaultAddress: profile?.default_address || '',
    defaultCity: profile?.default_city || '',
    defaultZip: profile?.default_zip || '',
  })

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          phone: formData.phone,
          default_address: formData.defaultAddress,
          default_city: formData.defaultCity,
          default_zip: formData.defaultZip,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success(locale === 'hu' ? 'Profil frissítve!' : 'Profile updated!')
      router.refresh()
    } catch {
      toast.error(locale === 'hu' ? 'Hiba történt' : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/${locale}`)
    router.refresh()
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === 'hu' ? 'hu-HU' : 'en-US', {
      style: 'currency',
      currency: 'HUF',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'hu' ? 'hu-HU' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            {locale === 'hu' ? 'Profilom' : 'My Profile'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {user.email}
          </p>
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          {locale === 'hu' ? 'Kijelentkezés' : 'Sign Out'}
        </Button>
      </div>

      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {locale === 'hu' ? 'Rendeléseim' : 'My Orders'}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {locale === 'hu' ? 'Beállítások' : 'Settings'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          {orders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {locale === 'hu' ? 'Még nincs rendelésed' : 'No orders yet'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {locale === 'hu' 
                    ? 'Rendelj finom pizzát most!' 
                    : 'Order some delicious pizza now!'}
                </p>
                <Button onClick={() => router.push(`/${locale}/menu`)}>
                  {locale === 'hu' ? 'Étlap megtekintése' : 'View Menu'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <Card key={order.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        #{order.order_number}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Clock className="h-4 w-4" />
                        {formatDate(order.created_at)}
                      </CardDescription>
                    </div>
                    <Badge className={`${statusColors[order.status]} text-white`}>
                      {statusLabels[order.status]?.[locale] || order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>
                          {item.quantity}x {item.product?.[locale === 'hu' ? 'name_hu' : 'name_en']}
                          {item.size && (
                            <span className="text-muted-foreground ml-1">
                              ({item.size[locale === 'hu' ? 'name_hu' : 'name_en']})
                            </span>
                          )}
                        </span>
                        <span className="font-medium">
                          {formatPrice(item.total_price)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-3" />
                  <div className="flex justify-between font-semibold">
                    <span>{locale === 'hu' ? 'Összesen' : 'Total'}</span>
                    <span className="text-primary">{formatPrice(order.total)}</span>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {order.delivery_type === 'delivery' 
                      ? (locale === 'hu' ? 'Házhozszállítás' : 'Delivery')
                      : (locale === 'hu' ? 'Elvitel' : 'Pickup')}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                {locale === 'hu' ? 'Személyes adatok' : 'Personal Information'}
              </CardTitle>
              <CardDescription>
                {locale === 'hu' 
                  ? 'Frissítsd adataidat a gyorsabb rendeléshez'
                  : 'Update your information for faster checkout'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">
                      {locale === 'hu' ? 'Teljes név' : 'Full Name'}
                    </Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      {locale === 'hu' ? 'Telefonszám' : 'Phone Number'}
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {locale === 'hu' ? 'Alapértelmezett szállítási cím' : 'Default Delivery Address'}
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultAddress">
                    {locale === 'hu' ? 'Utca, házszám' : 'Street Address'}
                  </Label>
                  <Input
                    id="defaultAddress"
                    value={formData.defaultAddress}
                    onChange={(e) => setFormData({ ...formData, defaultAddress: e.target.value })}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="defaultCity">
                      {locale === 'hu' ? 'Város' : 'City'}
                    </Label>
                    <Input
                      id="defaultCity"
                      value={formData.defaultCity}
                      onChange={(e) => setFormData({ ...formData, defaultCity: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultZip">
                      {locale === 'hu' ? 'Irányítószám' : 'ZIP Code'}
                    </Label>
                    <Input
                      id="defaultZip"
                      value={formData.defaultZip}
                      onChange={(e) => setFormData({ ...formData, defaultZip: e.target.value })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {locale === 'hu' ? 'Email cím' : 'Email Address'}
                  </Label>
                  <Input value={user.email || ''} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">
                    {locale === 'hu' 
                      ? 'Az email cím nem módosítható'
                      : 'Email address cannot be changed'}
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading 
                    ? (locale === 'hu' ? 'Mentés...' : 'Saving...')
                    : (locale === 'hu' ? 'Mentés' : 'Save Changes')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
