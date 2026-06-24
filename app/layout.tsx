import type { Metadata, Viewport } from 'next'
import { Inter, Fraunces } from 'next/font/google'
import { AnalyticsGate } from '@/components/analytics-gate'
import './globals.css'

// Body: Inter (clean, highly legible). Headings: Fraunces (warm artisan serif
// that suits a Mediterranean pizzeria). Defined on <body> so portaled UI
// (dropdowns, cart sheet, toasts) inherits the fonts too.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Terra Verde Pizza',
    template: '%s | Terra Verde Pizza',
  },
  description: 'Authentic Italian pizza made with fresh, local ingredients. Order online!',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#c75a3a' },
    { media: '(prefers-color-scheme: dark)', color: '#d4724f' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="hu" suppressHydrationWarning className={`${inter.variable} ${fraunces.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <AnalyticsGate />
      </body>
    </html>
  )
}
