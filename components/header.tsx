'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { ShoppingCart, User, Globe, LogOut, Shield, Package, Home, UtensilsCrossed, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { useCart } from '@/lib/cart-context'
import { createClient } from '@/lib/supabase/client'
import { locales, localeNames, type Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/get-dictionary'
import { useState, useEffect } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { OpenStatus, OpenStatusDot } from '@/components/open-status'
import { toast } from 'sonner'

interface HeaderProps {
  locale: Locale
  dictionary: Dictionary
}

interface Profile {
  is_admin: boolean
  full_name: string | null
}

export function Header({ locale, dictionary }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { itemCount, toggleCart } = useCart()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const t = dictionary

  useEffect(() => {
    const supabase = createClient()
    
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('is_admin, full_name')
          .eq('id', user.id)
          .single()
        setProfile(profileData)
      }
      setIsLoading(false)
    }
    
    fetchUser()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('is_admin, full_name')
          .eq('id', session.user.id)
          .single()
        setProfile(profileData)
      } else {
        setProfile(null)
      }
    })
    
    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    toast.success(locale === 'hu' ? 'Sikeres kijelentkezés!' : 'Successfully signed out!')
    router.push(`/${locale}`)
    router.refresh()
  }

  const switchLocale = (newLocale: Locale) => {
    const segments = pathname.split('/')
    segments[1] = newLocale
    return segments.join('/')
  }

  const navLinks = [
    { href: `/${locale}`, label: t.common.home, icon: Home },
    { href: `/${locale}/menu`, label: t.common.menu, icon: UtensilsCrossed },
    { href: `/${locale}/about`, label: locale === 'hu' ? 'Rólunk' : 'About', icon: Info },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <Image
            src="/images/logo.webp"
            alt="Terra Verde Pizzéria"
            width={48}
            height={48}
            className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
          />
          <span className="hidden font-serif text-xl font-bold sm:inline-block">
            Terra Verde
          </span>
        </Link>

        {/* Mobile Navigation - Visible on mobile */}
        <nav className="flex items-center gap-1 md:hidden">
          {navLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center justify-center px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="mt-0.5">{link.label}</span>
              </Link>
            )
          })}
          {/* Open Status Dot - Mobile */}
          <OpenStatusDot locale={locale} />
        </nav>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
          
          {/* Open Status */}
          <OpenStatus locale={locale} />
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Language Switcher - Desktop only */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden md:flex">
                <Globe className="h-5 w-5" />
                <span className="sr-only">Switch language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {locales.map((loc) => (
                <DropdownMenuItem key={loc} asChild>
                  <Link href={switchLocale(loc)} className={locale === loc ? 'font-bold' : ''}>
                    {localeNames[loc]}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu - Desktop only */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden md:flex">
                <User className="h-5 w-5" />
                <span className="sr-only">{t.common.profile}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {isLoading ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  {locale === 'hu' ? 'Betöltés...' : 'Loading...'}
                </div>
              ) : user ? (
                <>
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium truncate">
                      {profile?.full_name || user.email}
                    </p>
                    {profile?.full_name && (
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/${locale}/profile`} className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      {locale === 'hu' ? 'Profilom' : 'My Profile'}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/${locale}/profile`} className="cursor-pointer">
                      <Package className="h-4 w-4 mr-2" />
                      {locale === 'hu' ? 'Rendeléseim' : 'My Orders'}
                    </Link>
                  </DropdownMenuItem>
                  {profile?.is_admin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/${locale}/admin`} className="cursor-pointer">
                          <Shield className="h-4 w-4 mr-2" />
                          {locale === 'hu' ? 'Admin felület' : 'Admin Panel'}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    {locale === 'hu' ? 'Kijelentkezés' : 'Sign Out'}
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={`/${locale}/auth/login`}>{t.common.login}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/${locale}/auth/register`}>{t.common.register}</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Cart Button */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => toggleCart(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {itemCount}
              </span>
            )}
            <span className="sr-only">{t.common.cart}</span>
          </Button>

          {/* Mobile User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <User className="h-5 w-5" />
                <span className="sr-only">{t.common.profile}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {isLoading ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  {locale === 'hu' ? 'Betöltés...' : 'Loading...'}
                </div>
              ) : user ? (
                <>
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium truncate">
                      {profile?.full_name || user.email}
                    </p>
                    {profile?.full_name && (
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/${locale}/profile`} className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      {locale === 'hu' ? 'Profilom' : 'My Profile'}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/${locale}/profile`} className="cursor-pointer">
                      <Package className="h-4 w-4 mr-2" />
                      {locale === 'hu' ? 'Rendeléseim' : 'My Orders'}
                    </Link>
                  </DropdownMenuItem>
                  {profile?.is_admin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/${locale}/admin`} className="cursor-pointer">
                          <Shield className="h-4 w-4 mr-2" />
                          {locale === 'hu' ? 'Admin' : 'Admin'}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    {locale === 'hu' ? 'Kijelentkezés' : 'Sign Out'}
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={`/${locale}/auth/login`}>{t.common.login}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/${locale}/auth/register`}>{t.common.register}</Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5">
                <p className="text-xs text-muted-foreground mb-1">{locale === 'hu' ? 'Nyelv' : 'Language'}</p>
                <div className="flex gap-1">
                  {locales.map((loc) => (
                    <Link
                      key={loc}
                      href={switchLocale(loc)}
                      className={`flex-1 rounded px-2 py-1 text-center text-xs font-medium transition-colors ${
                        locale === loc 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {localeNames[loc]}
                    </Link>
                  ))}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
