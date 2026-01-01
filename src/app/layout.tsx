// CRITICAL: Force dynamic rendering for all pages
export const dynamic = 'force-dynamic'
export const revalidate = 0

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

// Metadata is now set via Head component to avoid static generation
// export const metadata: Metadata = { ... }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Social Media AI SaaS | AI MINDLOOP</title>
        <meta name="description" content="Automate your social media with AI-powered content generation" />
        <meta name="keywords" content="social media, AI, automation, content generation, SaaS" />
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