'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Calendar, CheckCircle, TrendingUp, Zap, Clock } from 'lucide-react'

interface Stats {
  totalPosts: number
  scheduledPosts: number
  publishedPosts: number
  aiGeneratedPosts: number
  averageConfidence: number
  timesSaved: number
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats>({
    totalPosts: 0,
    scheduledPosts: 0,
    publishedPosts: 0,
    aiGeneratedPosts: 0,
    averageConfidence: 0,
    timesSaved: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const cards = [
    {
      title: 'Total Posts',
      value: stats.totalPosts,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Scheduled',
      value: stats.scheduledPosts,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Published',
      value: stats.publishedPosts,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'AI Generated',
      value: stats.aiGeneratedPosts,
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'AI Confidence',
      value: `${stats.averageConfidence}%`,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Time Saved',
      value: `${stats.timesSaved}h`,
      icon: Clock,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {card.value}
                  </p>
                </div>
                <div className={`${card.bgColor} ${card.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
