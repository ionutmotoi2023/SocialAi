'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  CreditCard, 
  TrendingUp, 
  Users, 
  FileText, 
  Zap,
  Calendar,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  Download
} from 'lucide-react'
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-plans'
import { PlanSelectionDialog } from '@/components/billing/plan-selection-dialog'
import { toast } from 'sonner'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface Subscription {
  id: string
  plan: string
  status: string
  amount: number
  billingCycle: string
  currentPeriodStart: string
  currentPeriodEnd: string
  trialEndsAt?: string
  canceledAt?: string
  
  // Usage limits
  postsLimit: number
  usersLimit: number
  aiCreditsLimit: number
  
  // Current usage
  postsUsed: number
  usersUsed: number
  aiCreditsUsed: number
}

export default function BillingSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [showPlanDialog, setShowPlanDialog] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user) {
      router.push('/login')
      return
    }

    fetchSubscription()

    // Check for Stripe Checkout success/cancel
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') {
      toast.success('Payment successful! Your subscription has been upgraded.')
      // Clean URL
      router.replace('/dashboard/settings/billing', { scroll: false })
    } else if (params.get('canceled') === 'true') {
      toast.error('Payment canceled. Your subscription was not changed.')
      // Clean URL
      router.replace('/dashboard/settings/billing', { scroll: false })
    }
  }, [session, status, router])

  const fetchSubscription = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/subscription/current')
      if (!response.ok) throw new Error('Failed to fetch subscription')
      const data = await response.json()
      setSubscription(data.subscription)
    } catch (error) {
      console.error('Error fetching subscription:', error)
      toast.error('Failed to load subscription details')
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = () => {
    setShowPlanDialog(true)
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return
    }

    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to cancel subscription')

      toast.success('Subscription canceled successfully')
      fetchSubscription()
    } catch (error) {
      console.error('Error canceling subscription:', error)
      toast.error('Failed to cancel subscription')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'TRIAL': return 'bg-blue-100 text-blue-800'
      case 'PAST_DUE': return 'bg-yellow-100 text-yellow-800'
      case 'CANCELED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="h-4 w-4" />
      case 'TRIAL': return <Zap className="h-4 w-4" />
      case 'PAST_DUE': return <AlertCircle className="h-4 w-4" />
      case 'CANCELED': return <AlertCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculatePercentage = (used: number, limit: number) => {
    return limit > 0 ? (used / limit) * 100 : 0
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 80) return 'text-yellow-600'
    return 'text-green-600'
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading subscription details...</p>
        </div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Subscription Found</h3>
              <p className="text-muted-foreground mb-4">
                You don't have an active subscription yet.
              </p>
              <Button onClick={() => router.push('/pricing')}>
                View Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const plan = SUBSCRIPTION_PLANS[subscription.plan as keyof typeof SUBSCRIPTION_PLANS]
  const postsPercentage = calculatePercentage(subscription.postsUsed, subscription.postsLimit)
  const usersPercentage = calculatePercentage(subscription.usersUsed, subscription.usersLimit)
  const creditsPercentage = calculatePercentage(subscription.aiCreditsUsed, subscription.aiCreditsLimit)

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and view usage statistics
        </p>
      </div>

      {/* Trial Warning */}
      {subscription.status === 'TRIAL' && subscription.trialEndsAt && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900">Free Trial Active</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Your trial ends on {formatDate(subscription.trialEndsAt)}. 
                  Upgrade now to continue using premium features without interruption.
                </p>
              </div>
              <Button size="sm" onClick={handleUpgrade}>
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Plan
              </CardTitle>
              <CardDescription>Your active subscription details</CardDescription>
            </div>
            <Badge className={getStatusColor(subscription.status)}>
              <span className="mr-1">{getStatusIcon(subscription.status)}</span>
              {subscription.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold">{plan?.name || subscription.plan}</h3>
              <p className="text-muted-foreground">{plan?.description}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">
                ${subscription.amount.toFixed(0)}
                <span className="text-lg font-normal text-muted-foreground">/{subscription.billingCycle}</span>
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Billing Cycle</p>
              <p className="font-semibold capitalize">{subscription.billingCycle}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Current Period</p>
              <p className="font-semibold">
                {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>
            {subscription.trialEndsAt && (
              <div>
                <p className="text-muted-foreground">Trial Ends</p>
                <p className="font-semibold text-blue-600">{formatDate(subscription.trialEndsAt)}</p>
              </div>
            )}
            {subscription.canceledAt && (
              <div>
                <p className="text-muted-foreground">Canceled On</p>
                <p className="font-semibold text-red-600">{formatDate(subscription.canceledAt)}</p>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex gap-2">
            {subscription.plan !== 'ENTERPRISE' && subscription.status !== 'CANCELED' && (
              <Button onClick={handleUpgrade}>
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Button>
            )}
            {subscription.status === 'ACTIVE' && (
              <Button variant="outline" onClick={handleCancelSubscription}>
                Cancel Subscription
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push('/pricing')}>
              View All Plans
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Usage Statistics
          </CardTitle>
          <CardDescription>Your current usage for this billing period</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Posts Usage */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Posts</span>
              </div>
              <span className={`font-semibold ${getUsageColor(postsPercentage)}`}>
                {subscription.postsUsed} / {subscription.postsLimit}
              </span>
            </div>
            <Progress value={postsPercentage} className="h-2" />
            {postsPercentage >= 80 && (
              <p className="text-xs text-yellow-600 mt-1">
                ⚠️ You're approaching your post limit. Consider upgrading.
              </p>
            )}
          </div>

          {/* Users Usage */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Team Members</span>
              </div>
              <span className={`font-semibold ${getUsageColor(usersPercentage)}`}>
                {subscription.usersUsed} / {subscription.usersLimit}
              </span>
            </div>
            <Progress value={usersPercentage} className="h-2" />
            {usersPercentage >= 80 && (
              <p className="text-xs text-yellow-600 mt-1">
                ⚠️ You're approaching your team member limit.
              </p>
            )}
          </div>

          {/* AI Credits Usage */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">AI Credits</span>
              </div>
              <span className={`font-semibold ${getUsageColor(creditsPercentage)}`}>
                {subscription.aiCreditsUsed} / {subscription.aiCreditsLimit}
              </span>
            </div>
            <Progress value={creditsPercentage} className="h-2" />
            {creditsPercentage >= 80 && (
              <p className="text-xs text-yellow-600 mt-1">
                ⚠️ You're running low on AI credits. Upgrade for more.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan Features */}
      {plan && (
        <Card>
          <CardHeader>
            <CardTitle>Plan Features</CardTitle>
            <CardDescription>What's included in your {plan.name} plan</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Plan Selection Dialog */}
      {subscription && (
        <PlanSelectionDialog
          open={showPlanDialog}
          onOpenChange={setShowPlanDialog}
          currentPlan={subscription.plan as any}
          currentUsage={{
            postsUsed: subscription.postsUsed,
            usersUsed: subscription.usersUsed,
            aiCreditsUsed: subscription.aiCreditsUsed
          }}
        />
      )}
    </div>
  )
}
