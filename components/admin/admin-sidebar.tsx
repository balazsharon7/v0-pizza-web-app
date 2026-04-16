'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, Package, Settings, FolderOpen, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/get-dictionary'

interface AdminSidebarProps {
  locale: Locale
  dictionary: Dictionary
}

export function AdminSidebar({ locale, dictionary }: AdminSidebarProps) {
  const pathname = usePathname()
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

  return (
    <aside className="hidden w-64 border-r bg-card lg:block">
      <div className="flex h-full flex-col">
        <div className="border-b p-4">
          <h2 className="font-serif text-lg font-bold">{t.common.admin}</h2>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== `/${locale}/admin` && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
