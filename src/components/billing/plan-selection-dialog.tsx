'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, AlertTriangle } from 'lucide-react'
import { SubscriptionPlanType } from '@/lib/subscription-plans'
import { useToast } from '@/hooks/use-toast'
import type { PricingPlan } from '@/lib/pricing-utils'

interface PlanSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPlan: SubscriptionPlanType
  currentUsage?: {
    postsUsed: number
    usersUsed: number
    aiCreditsUsed: number
  }
}

export function PlanSelectionDialog({
  open,
  onOpenChange,
  currentPlan,
  currentUsage = { postsUsed: 0, usersUsed: 0, aiCreditsUsed: 0 }
}: PlanSelectionDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // Fetch dynamic pricing from API
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch('/api/pricing')
        if (response.ok) {
          const data = await response.json()
          setPlans(data.plans)
        }
      } catch (error) {
        console.error('Failed to fetch pricing:', error)
      } finally {
        setLoadingPlans(false)
      }
    }
    if (open) {
      fetchPricing()
    }
  }, [open])

  // Helper to get plan by ID
  const getPlan = (planId: SubscriptionPlanType) => {
    return plans.find(p => p.planId === planId)
  }

  const availablePlans = plans.filter(
    plan => plan.planId !== currentPlan
  ).map(p => p.planId as SubscriptionPlanType)

  const handleConfirm = async () => {
    if (!selectedPlan) return

    setIsLoading(true)

    try {
      const upgrading = isUpgrade()

      // For upgrades (paid plans), redirect to Stripe Checkout
      if (upgrading && selectedPlan !== 'FREE') {
        const response = await fetch('/api/subscription/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: selectedPlan })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create checkout session')
        }

        // Redirect to Stripe Checkout
        if (data.url) {
          window.location.href = data.url
        } else {
          throw new Error('No checkout URL returned')
        }
      } else {
        // For downgrades or FREE plan, use direct API
        const response = await fetch('/api/subscription/change-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPlan: selectedPlan })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to change plan')
        }

        toast({
          title: 'Plan changed successfully',
          description: `Your subscription has been downgraded to ${selectedPlan}.`
        })

        onOpenChange(false)
        router.refresh()
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change plan',
        variant: 'destructive'
      })
      setIsLoading(false)
    }
  }

  const isUpgrade = () => {
    if (!selectedPlan) return false
    const currentPlanData = getPlan(currentPlan)
    const newPlanData = getPlan(selectedPlan)
    if (!currentPlanData || !newPlanData) return false
    return newPlanData.price > currentPlanData.price
  }

  const getDowngradeWarnings = (planId: string) => {
    const warnings: string[] = []
    const planData = getPlan(planId as SubscriptionPlanType)
    if (!planData) return warnings
    const newLimits = planData.limits

    if (currentUsage.postsUsed > newLimits.posts) {
      warnings.push(`You've used ${currentUsage.postsUsed} posts, but ${planData.name} allows only ${newLimits.posts}`)
    }
    if (currentUsage.usersUsed > newLimits.users) {
      warnings.push(`You have ${currentUsage.usersUsed} users, but ${planData.name} allows only ${newLimits.users}`)
    }
    if (currentUsage.aiCreditsUsed > newLimits.aiCredits) {
      warnings.push(`You've used ${currentUsage.aiCreditsUsed} AI credits, but ${planData.name} allows only ${newLimits.aiCredits}`)
    }

    return warnings
  }

  const calculateProration = () => {
    if (!selectedPlan) return null
    
    const currentPlanData = getPlan(currentPlan)
    const newPlanData = getPlan(selectedPlan)
    if (!currentPlanData || !newPlanData) return null
    
    const currentPrice = currentPlanData.price
    const newPrice = newPlanData.price
    const priceDiff = newPrice - currentPrice
    
    // Assume 15 days left in billing cycle (simplified)
    const daysInMonth = 30
    const daysRemaining = 15
    const proratedAmount = (priceDiff / daysInMonth) * daysRemaining

    return {
      isUpgrade: priceDiff > 0,
      proratedAmount: Math.abs(proratedAmount),
      fullPriceDiff: Math.abs(priceDiff)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Change Your Plan</DialogTitle>
          <DialogDescription>
            Current plan: <strong>{getPlan(currentPlan)?.name || currentPlan}</strong> ({getPlan(currentPlan)?.priceDisplay || 'N/A'})
          </DialogDescription>
        </DialogHeader>

        {loadingPlans ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (

        <div className="space-y-4">
          {availablePlans.map((planId) => {
            const planDetails = getPlan(planId)
            if (!planDetails) return null
            const warnings = getDowngradeWarnings(planId)
            const isSelected = selectedPlan === planId
            const planPrice = planDetails.price
            const currentPlanData = getPlan(currentPlan)
            const currentPrice = currentPlanData?.price || 0
            const isUpgradePlan = planPrice > currentPrice

            return (
              <button
                key={planId}
                onClick={() => setSelectedPlan(planId)}
                className={`w-full text-left p-4 border rounded-lg transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'border-gray-200 hover:border-gray-300'
                } ${warnings.length > 0 ? 'opacity-75' : ''}`}
                disabled={warnings.length > 0}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{planDetails.name}</h3>
                      <Badge variant={isUpgradePlan ? 'default' : 'secondary'}>
                        {isUpgradePlan ? 'Upgrade' : 'Downgrade'}
                      </Badge>
                      {isSelected && (
                        <Check className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                    <p className="text-2xl font-bold mb-2">{planDetails.priceDisplay}</p>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <div>• {planDetails.limits.posts} posts/month</div>
                      <div>• {planDetails.limits.users} team members</div>
                      <div>• {planDetails.limits.aiCredits} AI credits/month</div>
                    </div>
                    
                    {warnings.length > 0 && (
                      <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1">
                            <p className="font-semibold">Cannot downgrade:</p>
                            {warnings.map((warning, idx) => (
                              <p key={idx}>• {warning}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {selectedPlan && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h4 className="font-semibold mb-2">Change Summary:</h4>
            <div className="text-sm space-y-1">
              <p>Current: {currentPlan} → New: {selectedPlan}</p>
              {(() => {
                const proration = calculateProration()
                return proration ? (
                  <>
                    <p className="text-gray-600 dark:text-gray-400">
                      {proration.isUpgrade ? 'Additional charge' : 'Credit'} (prorated): 
                      <strong className="ml-1">${proration.proratedAmount.toFixed(2)}</strong>
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Starting next billing cycle: 
                      <strong className="ml-1">{getPlan(selectedPlan)?.priceDisplay || 'N/A'}</strong>
                    </p>
                  </>
                ) : null
              })()}
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Changes take effect immediately. Your billing cycle remains unchanged.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedPlan || isLoading}
          >
            {isLoading ? 'Processing...' : `Confirm ${isUpgrade() ? 'Upgrade' : 'Downgrade'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
