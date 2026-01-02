'use client'

export const dynamic = 'force-dynamic'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard/header'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bot, Calendar, FileText, Image, Zap, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Bot className="h-12 w-12 animate-bounce text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    router.push('/login')
    return null
  }

  const quickActions = [
    {
      icon: <FileText className="h-5 w-5" />,
      title: 'Create Post',
      description: 'Generate AI-powered content',
      href: '/dashboard/posts/create',
      color: 'bg-blue-500',
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      title: 'Schedule Posts',
      description: 'Plan your content calendar',
      href: '/dashboard/calendar',
      color: 'bg-purple-500',
    },
    {
      icon: <Image className="h-5 w-5" />,
      title: 'Brand Assets',
      description: 'Manage logos and templates',
      href: '/dashboard/brand',
      color: 'bg-green-500',
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'Auto-Pilot',
      description: 'Activate automated posting',
      href: '/dashboard/autopilot',
      color: 'bg-orange-500',
    },
  ]

  return (
    <>
      {/* Header */}
      <DashboardHeader />

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {session.user.name || 'User'}! 👋
            </h1>
            <p className="text-gray-600">
              Here's what's happening with your social media automation
            </p>
          </div>

          {/* Stats Cards */}
          <StatsCards />

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Card
                  key={index}
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => router.push(action.href)}
                >
                  <CardContent className="p-6">
                    <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                      {action.icon}
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <RecentActivity />

          {/* AI Insights */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                    AI Performance Insights
                  </CardTitle>
                  <CardDescription>
                    How your AI is performing this week
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 mb-1">92%</div>
                  <div className="text-sm text-gray-600">Approval Rate</div>
                  <div className="text-xs text-gray-500 mt-1">↑ 5% from last week</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-1">3.2s</div>
                  <div className="text-sm text-gray-600">Avg Generation Time</div>
                  <div className="text-xs text-gray-500 mt-1">↓ 0.5s faster</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600 mb-1">89%</div>
                  <div className="text-sm text-gray-600">User Satisfaction</div>
                  <div className="text-xs text-gray-500 mt-1">↑ 3% improvement</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
    </>
  )
}
