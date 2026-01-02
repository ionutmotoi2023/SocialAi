'use client'

import { SessionProvider } from 'next-auth/react'
import { DashboardSidebar } from '@/components/dashboard/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar - visible on all dashboard pages */}
        <DashboardSidebar />
        
        {/* Main Content Area - Fixed overflow for proper scrolling */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {children}
        </div>
      </div>
    </SessionProvider>
  )
}
