'use client'

import { useSession, signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  Settings, 
  Users, 
  TrendingUp,
  Zap,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Home
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function DashboardSidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [postsCount, setPostsCount] = useState<number>(0)

  // Fetch real posts count from API
  useEffect(() => {
    const fetchPostsCount = async () => {
      try {
        const response = await fetch('/api/dashboard/stats')
        if (response.ok) {
          const data = await response.json()
          setPostsCount(data.totalPosts || 0)
        }
      } catch (error) {
        console.error('Failed to fetch posts count:', error)
      }
    }
    
    fetchPostsCount()
  }, [])

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
      badge: postsCount > 0 ? postsCount.toString() : undefined,
    },
    {
      name: 'Calendar',
      href: '/dashboard/calendar',
      icon: Calendar,
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

  // Main navigation items for bottom bar (4 most important)
  const bottomNavItems = [
    {
      name: 'Home',
      href: '/dashboard',
      icon: Home,
    },
    {
      name: 'Posts',
      href: '/dashboard/posts',
      icon: FileText,
    },
    {
      name: 'Calendar',
      href: '/dashboard/calendar',
      icon: Calendar,
    },
    {
      name: 'Analytics',
      href: '/dashboard/analytics',
      icon: TrendingUp,
    },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false)
    router.push(href)
  }

  return (
    <>
      {/* Mobile Full-Page Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Link href="/dashboard" className="flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
              <Image 
                src="/logo.png" 
                alt="AI MINDLOOP" 
                width={40} 
                height={40}
                className="rounded-lg"
              />
              <div>
                <div className="font-bold text-base">AI MINDLOOP</div>
                <div className="text-xs text-gray-500">Social Media AI</div>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Tenant Info */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="text-xs font-semibold text-gray-500 mb-1">WORKSPACE</div>
            <div className="font-medium text-sm truncate">{session?.user.tenant.name}</div>
            <Badge variant="secondary" className="mt-2 text-xs">
              {session?.user.role.replace('_', ' ')}
            </Badge>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.href)}
                  className={`
                    w-full flex items-center justify-between px-4 py-4 rounded-lg text-base font-medium transition-colors
                    ${active 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-6 w-6" />
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
                  {active && <ChevronRight className="h-5 w-5" />}
                </button>
              )
            })}
          </nav>

          {/* User Profile Section */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                {session?.user.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{session?.user.name}</div>
                <div className="text-xs text-gray-500 truncate">{session?.user.email}</div>
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
      )}

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-2 py-2 safe-area-bottom">
        <div className="flex items-center justify-around">
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            
            return (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className={`
                  flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors min-w-[60px]
                  ${active 
                    ? 'text-blue-600' 
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <Icon className={`h-6 w-6 mb-1 ${active ? 'stroke-[2.5]' : ''}`} />
                <span className={`text-xs ${active ? 'font-semibold' : 'font-medium'}`}>
                  {item.name}
                </span>
              </button>
            )
          })}
          
          {/* Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors text-gray-600 hover:text-gray-900 min-w-[60px]"
          >
            <Menu className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Menu</span>
          </button>
        </div>
      </div>

      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:bg-white lg:border-r lg:border-gray-200">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <Image 
              src="/logo.png" 
              alt="AI MINDLOOP SRL" 
              width={48} 
              height={48}
              className="rounded-lg"
            />
            <div>
              <div className="font-bold text-lg">AI MINDLOOP SRL</div>
              <div className="text-xs text-gray-500">Social Media AI</div>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard')}
            title="Home"
            className="flex-shrink-0"
          >
            <Home className="h-5 w-5" />
          </Button>
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
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className={`
                  w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors
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
              </button>
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

      {/* Spacer for mobile bottom bar */}
      <div className="lg:hidden h-16" />
    </>
  )
}
