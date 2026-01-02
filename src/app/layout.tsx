// CRITICAL: Force dynamic rendering for all pages
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'
import type { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Social Media AI - AI MINDLOOP SRL',
  description: 'Viitorul afacerii tale se interconectează cu AI!',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/logo-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/logo-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/logo-192.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}