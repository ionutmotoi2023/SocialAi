'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, TrendingUp, X } from 'lucide-react'

export interface UsageWarningProps {
  quotaType: 'posts' | 'users' | 'aiCredits'
  used: number
  limit: number
  percentage: number
  dismissible?: boolean
}

export function UsageWarning({ quotaType, used, limit, percentage, dismissible = true }: UsageWarningProps) {
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)

  // Don't show if below 80%
  if (percentage < 80 || dismissed) {
    return null
  }

  const getQuotaLabel = () => {
    switch (quotaType) {
      case 'posts': return 'posts'
      case 'users': return 'team members'
      case 'aiCredits': return 'AI credits'
    }
  }

  const getColorClasses = () => {
    if (percentage >= 100) {
      return {
        bg: 'bg-red-50 border-red-200',
        text: 'text-red-900',
        icon: 'text-red-600',
        button: 'bg-red-600 hover:bg-red-700'
      }
    } else if (percentage >= 90) {
      return {
        bg: 'bg-orange-50 border-orange-200',
        text: 'text-orange-900',
        icon: 'text-orange-600',
        button: 'bg-orange-600 hover:bg-orange-700'
      }
    } else {
      return {
        bg: 'bg-yellow-50 border-yellow-200',
        text: 'text-yellow-900',
        icon: 'text-yellow-600',
        button: 'bg-yellow-600 hover:bg-yellow-700'
      }
    }
  }

  const colors = getColorClasses()

  const getMessage = () => {
    if (percentage >= 100) {
      return {
        title: `You've reached your ${getQuotaLabel()} limit!`,
        description: `You're using ${used}/${limit} ${getQuotaLabel()}. Upgrade your plan to continue.`
      }
    } else if (percentage >= 90) {
      return {
        title: `Almost out of ${getQuotaLabel()}!`,
        description: `You're using ${used}/${limit} ${getQuotaLabel()} (${Math.round(percentage)}%). Consider upgrading soon.`
      }
    } else {
      return {
        title: `Running low on ${getQuotaLabel()}`,
        description: `You're using ${used}/${limit} ${getQuotaLabel()} (${Math.round(percentage)}%). You may want to upgrade your plan.`
      }
    }
  }

  const message = getMessage()

  return (
    <Card className={`border-2 ${colors.bg}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <AlertTriangle className={`h-5 w-5 ${colors.icon} mt-0.5 flex-shrink-0`} />
            <div className="flex-1">
              <h3 className={`font-semibold ${colors.text}`}>{message.title}</h3>
              <p className={`text-sm mt-1 ${colors.text} opacity-90`}>
                {message.description}
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  className={colors.button}
                  onClick={() => router.push('/pricing')}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push('/dashboard/settings/billing')}
                >
                  View Usage
                </Button>
              </div>
            </div>
          </div>
          {dismissible && (
            <button
              onClick={() => setDismissed(true)}
              className={`${colors.text} opacity-50 hover:opacity-100 transition-opacity`}
              aria-label="Dismiss"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Hook to check all usage quotas and show warnings
 */
export function useUsageWarnings() {
  const [warnings, setWarnings] = useState<UsageWarningProps[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsageStats()
  }, [])

  const fetchUsageStats = async () => {
    try {
      const response = await fetch('/api/subscription/current')
      if (!response.ok) throw new Error('Failed to fetch usage')

      const data = await response.json()
      const subscription = data.subscription

      const warningsList: UsageWarningProps[] = []

      // Check posts quota
      const postsPercentage = (subscription.postsUsed / subscription.postsLimit) * 100
      if (postsPercentage >= 80) {
        warningsList.push({
          quotaType: 'posts',
          used: subscription.postsUsed,
          limit: subscription.postsLimit,
          percentage: postsPercentage
        })
      }

      // Check users quota
      const usersPercentage = (subscription.usersUsed / subscription.usersLimit) * 100
      if (usersPercentage >= 80) {
        warningsList.push({
          quotaType: 'users',
          used: subscription.usersUsed,
          limit: subscription.usersLimit,
          percentage: usersPercentage
        })
      }

      // Check AI credits quota
      const creditsPercentage = (subscription.aiCreditsUsed / subscription.aiCreditsLimit) * 100
      if (creditsPercentage >= 80) {
        warningsList.push({
          quotaType: 'aiCredits',
          used: subscription.aiCreditsUsed,
          limit: subscription.aiCreditsLimit,
          percentage: creditsPercentage
        })
      }

      setWarnings(warningsList)
    } catch (error) {
      console.error('Error fetching usage stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return { warnings, loading, refresh: fetchUsageStats }
}
