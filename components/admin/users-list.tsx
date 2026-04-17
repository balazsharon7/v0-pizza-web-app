'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Shield, ShieldOff, Phone, MapPin, Package, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/get-dictionary'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  default_address: string | null
  default_city: string | null
  is_admin: boolean
  created_at: string
  orderCount: number
}

interface UsersListProps {
  locale: Locale
  dictionary: Dictionary
}

export function UsersList({ locale, dictionary }: UsersListProps) {
  const router = useRouter()
  const [users, setUsers] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [toggleAdminUser, setToggleAdminUser] = useState<Profile | null>(null)

  const supabase = createClient()

  // Fetch users on client side where we have the session
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true)
      
      // First get all profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('[v0] Error fetching profiles:', error)
        toast.error(locale === 'hu' ? 'Hiba a felhasználók betöltésekor' : 'Error loading users')
        setIsLoading(false)
        return
      }

      // Then fetch order counts for each user
      const usersWithCounts = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { count } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id)
          
          return {
            ...profile,
            orderCount: count || 0
          }
        })
      )

      setUsers(usersWithCounts)
      setIsLoading(false)
    }

    fetchUsers()
  }, [locale])

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone?.includes(searchQuery) ||
    user.default_city?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleToggleAdmin = async () => {
    if (!toggleAdminUser) return
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !toggleAdminUser.is_admin })
        .eq('id', toggleAdminUser.id)
      
      if (error) throw error
      toast.success(locale === 'hu' ? 'Jogosultság módosítva!' : 'Permission updated!')
      setToggleAdminUser(null)
      
      // Refresh the list
      setUsers(prev => prev.map(u => 
        u.id === toggleAdminUser.id 
          ? { ...u, is_admin: !toggleAdminUser.is_admin }
          : u
      ))
    } catch (error) {
      console.error('Toggle admin error:', error)
      toast.error(locale === 'hu' ? 'Hiba történt' : 'Error occurred')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'hu' ? 'hu-HU' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const totalUsers = users.length
  const adminUsers = users.filter(u => u.is_admin).length
  const usersWithOrders = users.filter(u => u.orderCount > 0).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{locale === 'hu' ? 'Felhasználók' : 'Users'}</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {locale === 'hu' ? 'Összes felhasználó' : 'Total Users'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {locale === 'hu' ? 'Adminok' : 'Admins'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {locale === 'hu' ? 'Rendelő felhasználók' : 'Users with Orders'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersWithOrders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder={locale === 'hu' ? 'Keresés név, telefon, város alapján...' : 'Search by name, phone, city...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{locale === 'hu' ? 'Felhasználó' : 'User'}</TableHead>
                <TableHead>{locale === 'hu' ? 'Kapcsolat' : 'Contact'}</TableHead>
                <TableHead>{locale === 'hu' ? 'Cím' : 'Address'}</TableHead>
                <TableHead className="text-center">{locale === 'hu' ? 'Rendelések' : 'Orders'}</TableHead>
                <TableHead>{locale === 'hu' ? 'Regisztrált' : 'Registered'}</TableHead>
                <TableHead className="text-center">{locale === 'hu' ? 'Admin' : 'Admin'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="font-medium">
                        {user.full_name || (locale === 'hu' ? 'Névtelen' : 'Anonymous')}
                      </div>
                      {user.is_admin && (
                        <Badge variant="default" className="text-xs">Admin</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      {user.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.default_city || user.default_address ? (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {[user.default_city, user.default_address].filter(Boolean).join(', ')}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      {user.orderCount}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setToggleAdminUser(user)}
                      title={user.is_admin 
                        ? (locale === 'hu' ? 'Admin jog elvétele' : 'Remove admin')
                        : (locale === 'hu' ? 'Admin jog adása' : 'Make admin')}
                    >
                      {user.is_admin ? (
                        <Shield className="h-4 w-4 text-primary" />
                      ) : (
                        <ShieldOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredUsers.length === 0 && !isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          {locale === 'hu' ? 'Nincs találat' : 'No results found'}
        </div>
      )}

      {/* Toggle Admin Confirmation */}
      <AlertDialog open={!!toggleAdminUser} onOpenChange={() => setToggleAdminUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleAdminUser?.is_admin
                ? (locale === 'hu' ? 'Admin jog elvétele' : 'Remove Admin Rights')
                : (locale === 'hu' ? 'Admin jog adása' : 'Grant Admin Rights')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleAdminUser?.is_admin
                ? (locale === 'hu' 
                    ? `Biztosan elveszed az admin jogot ${toggleAdminUser?.full_name || 'ettől a felhasználótól'}?`
                    : `Are you sure you want to remove admin rights from ${toggleAdminUser?.full_name || 'this user'}?`)
                : (locale === 'hu'
                    ? `Biztosan admin jogot adsz ${toggleAdminUser?.full_name || 'ennek a felhasználónak'}?`
                    : `Are you sure you want to grant admin rights to ${toggleAdminUser?.full_name || 'this user'}?`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{locale === 'hu' ? 'Mégse' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleAdmin}>
              {locale === 'hu' ? 'Megerősítés' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
