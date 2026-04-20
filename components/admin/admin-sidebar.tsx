'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, Package, Settings, FolderOpen, Users, Menu, X, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet'
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

      {/* Mobile Header Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background lg:hidden">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 4).map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== `/${locale}/admin` && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px]',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
          
          {/* More menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-muted-foreground min-w-[64px]">
                <Menu className="h-5 w-5" />
                <span className="text-[10px] font-medium">
                  {locale === 'hu' ? 'Több' : 'More'}
                </span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-bold">{t.common.admin}</h3>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon">
                    <X className="h-5 w-5" />
                  </Button>
                </SheetClose>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-6">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== `/${locale}/admin` && pathname.startsWith(item.href))
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-xl p-4 transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      )}
                    >
                      <item.icon className="h-6 w-6" />
                      <span className="text-xs font-medium text-center">{item.label}</span>
                    </Link>
                  )
                })}
              </div>

              <Link 
                href={`/${locale}`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-muted text-sm font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                {locale === 'hu' ? 'Vissza a weboldalra' : 'Back to website'}
              </Link>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  )
}
