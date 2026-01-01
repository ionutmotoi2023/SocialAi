'use client'

import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Bot, 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  Image as ImageIcon, 
  Settings, 
  Users, 
  TrendingUp,
  Zap,
  LogOut,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function DashboardSidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Posts',
      href: '/dashboard/posts',
      icon: FileText,
      badge: '12',
    },
    {
      name: 'Calendar',
      href: '/dashboard/calendar',
      icon: Calendar,
    },
    {
      name: 'Brand Assets',
      href: '/dashboard/brand',
      icon: ImageIcon,
    },
    {
      name: 'Auto-Pilot',
      href: '/dashboard/autopilot',
      icon: Zap,
      badge: 'PRO',
    },
    {
      name: 'Analytics',
      href: '/dashboard/analytics',
      icon: TrendingUp,
    },
    {
      name: 'Team',
      href: '/dashboard/team',
      icon: Users,
    },
    {
      name: 'Integrations',
      href: '/dashboard/settings/integrations',
      icon: Settings,
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
    },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Bot className="h-8 w-8 text-blue-600" />
          <div>
            <div className="font-bold text-lg">Social Media AI</div>
            <div className="text-xs text-gray-500">AI MINDLOOP</div>
          </div>
        </Link>
      </div>

      {/* Tenant Info */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="text-xs font-semibold text-gray-500 mb-1">WORKSPACE</div>
        <div className="font-medium text-sm truncate">{session?.user.tenant.name}</div>
        <Badge variant="secondary" className="mt-2 text-xs">
          {session?.user.role.replace('_', ' ')}
        </Badge>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${active 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <div className="flex items-center space-x-3">
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <Badge 
                  variant={item.badge === 'PRO' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {item.badge}
                </Badge>
              )}
              {active && <ChevronRight className="h-4 w-4" />}
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
              {session?.user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{session?.user.name}</div>
              <div className="text-xs text-gray-500 truncate">{session?.user.email}</div>
            </div>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
