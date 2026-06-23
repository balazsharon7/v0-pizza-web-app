'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, Package, Settings, FolderOpen, Users, Menu, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useState } from 'react'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/get-dictionary'

interface AdminSidebarProps {
  locale: Locale
  dictionary: Dictionary
}

export function AdminSidebar({ locale, dictionary }: AdminSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const t = dictionary

  const navItems = [
    {
      href: `/${locale}/admin`,
      label: locale === 'hu' ? 'Áttekintés' : 'Overview',
      icon: LayoutDashboard,
    },
    {
      href: `/${locale}/admin/orders`,
      label: locale === 'hu' ? 'Rendelések' : 'Orders',
      icon: ShoppingBag,
    },
    {
      href: `/${locale}/admin/products`,
      label: locale === 'hu' ? 'Termékek' : 'Products',
      icon: Package,
    },
    {
      href: `/${locale}/admin/categories`,
      label: locale === 'hu' ? 'Kategóriák' : 'Categories',
      icon: FolderOpen,
    },
    {
      href: `/${locale}/admin/users`,
      label: locale === 'hu' ? 'Felhasználók' : 'Users',
      icon: Users,
    },
    {
      href: `/${locale}/admin/settings`,
      label: locale === 'hu' ? 'Beállítások' : 'Settings',
      icon: Settings,
    },
  ]

  const NavContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex-1 space-y-1 p-4">
      {navItems.map((item) => {
        const isActive = pathname === item.href || 
          (item.href !== `/${locale}/admin` && pathname.startsWith(item.href))
        
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r bg-card lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b p-4">
            <h2 className="font-serif text-lg font-bold">{t.common.admin}</h2>
          </div>
          <NavContent />
          <div className="border-t p-4">
            <Link 
              href={`/${locale}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {locale === 'hu' ? 'Vissza a weboldalra' : 'Back to website'}
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Top Navigation */}
      <div className="lg:hidden border-b bg-background sticky top-0 z-40">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b">
                    <h2 className="font-serif text-lg font-bold">{t.common.admin}</h2>
                  </div>
                  <NavContent onNavigate={() => setMobileOpen(false)} />
                  <div className="border-t p-4">
                    <Link 
                      href={`/${locale}`}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      {locale === 'hu' ? 'Vissza a weboldalra' : 'Back to website'}
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="font-serif font-bold">{t.common.admin}</h1>
          </div>
          
          {/* Quick navigation icons */}
          <div className="flex items-center gap-1">
            {navItems.slice(0, 4).map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== `/${locale}/admin` && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center justify-center rounded-lg p-2 transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
