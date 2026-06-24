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
  const [scrolled, setScrolled] = useState(false)
  const t = dictionary

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    const syncUser = async (userId: string, currentUser: SupabaseUser | null) => {
      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('is_admin, full_name')
          .eq('id', userId)
          .single()
        if (cancelled) return
        if (error) {
          console.warn('[header] profile fetch failed', error)
          // Fallback to JWT user_metadata so the admin link still works even
          // before scripts/005_fix_rls_recursion.sql has been applied.
          const meta = currentUser?.user_metadata as
            | { is_admin?: boolean; full_name?: string }
            | undefined
          setProfile({
            is_admin: !!meta?.is_admin,
            full_name: meta?.full_name ?? null,
          })
          return
        }
        setProfile(profileData)
      } catch (err) {
        if (cancelled) return
        console.warn('[header] profile fetch threw', err)
      }
    }

    const applySession = async (
      session: { user: SupabaseUser } | null,
      { clearOnNull }: { clearOnNull: boolean },
    ) => {
      if (cancelled) return
      const nextUser = session?.user ?? null
      if (nextUser) {
        setUser(nextUser)
        await syncUser(nextUser.id, nextUser)
      } else if (clearOnNull) {
        setUser(null)
        setProfile(null)
      }
      // If clearOnNull is false (transient checks like visibilitychange or
      // a getSession that returned null due to a network blip), we keep
      // whatever user we already have. The auth listener below is the
      // single source of truth for explicit SIGNED_OUT.
      setIsLoading(false)
    }

    // Hydrate from the cached session. If this fails, we keep whatever the
    // listener tells us next — don't preemptively flag the user as signed out.
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) console.warn('[header] getSession failed', error)
        applySession(data?.session ?? null, { clearOnNull: false })
      })
      .catch((err) => {
        console.warn('[header] getSession threw', err)
        if (!cancelled) setIsLoading(false)
      })

    // SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED / INITIAL_SESSION come through
    // here. SIGNED_OUT explicitly clears state; everything else only updates
    // when there's actually a user attached.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const clear = event === 'SIGNED_OUT'
        applySession(session, { clearOnNull: clear })
      },
    )

    // Safety fallback: never leave the UI stuck in the loading state.
    const loadingTimeout = setTimeout(() => {
      if (!cancelled) setIsLoading(false)
    }, 3000)

    // Re-verify when the tab becomes visible again. Do NOT clear the user if
    // the lookup transiently fails — the auth listener handles real sign-outs.
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return
      supabase.auth
        .getSession()
        .then(({ data }) => applySession(data?.session ?? null, { clearOnNull: false }))
        .catch((err) => console.warn('[header] visibility getSession threw', err))
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      clearTimeout(loadingTimeout)
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        // Fall back to a local-only sign out so the client state still clears
        // if the global sign out request to the auth server fails.
        await supabase.auth.signOut({ scope: 'local' })
      }
    } catch (err) {
      console.error('Sign out failed:', err)
      await supabase.auth.signOut({ scope: 'local' })
    }
    setUser(null)
    setProfile(null)
    toast.success(locale === 'hu' ? 'Sikeres kijelentkezés!' : 'Successfully signed out!')
    // Hard navigation to guarantee server-rendered state reflects the sign out
    // and any stale cookies/middleware data are flushed.
    window.location.href = `/${locale}`
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
    <header className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-shadow duration-300 ${scrolled ? 'header-scrolled' : ''}`}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-3">
          <div className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-full overflow-hidden ring-2 ring-primary/20 shadow-md">
            <Image
              src="/images/logo.webp"
              alt="Terra Verde Pizzéria"
              fill
              className="object-cover"
            />
          </div>
          <span className="hidden font-serif text-xl font-semibold tracking-tight sm:inline-block">
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
        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => {
            const isActive =
              link.href === `/${locale}` ? pathname === link.href : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={`relative text-sm font-medium transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:rounded-full after:bg-primary after:transition-all after:duration-300 ${
                  isActive
                    ? 'text-primary after:w-full'
                    : 'text-foreground/70 hover:text-foreground after:w-0 hover:after:w-full'
                }`}
              >
                {link.label}
              </Link>
            )
          })}

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
