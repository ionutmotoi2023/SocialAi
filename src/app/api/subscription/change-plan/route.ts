import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getPlanLimits, getPlanPrice, SUBSCRIPTION_PLANS } from '@/lib/subscription-plans'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's tenant
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { tenant: true }
    })

    if (!user || !user.tenantId) {
      return NextResponse.json(
        { error: 'User has no tenant' },
        { status: 404 }
      )
    }

    // Only TENANT_ADMIN can change plans
    if (user.role !== 'TENANT_ADMIN') {
      return NextResponse.json(
        { error: 'Only tenant admins can change subscription plans' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { newPlan } = body

    // Validate plan
    const validPlans = ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']
    if (!validPlans.includes(newPlan)) {
      return NextResponse.json(
        { error: `Invalid plan. Must be one of: ${validPlans.join(', ')}` },
        { status: 400 }
      )
    }

    // Get current subscription
    const currentSubscription = await prisma.subscription.findUnique({
      where: { tenantId: user.tenantId }
    })

    if (!currentSubscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Can't "change" to the same plan
    if (currentSubscription.plan === newPlan) {
      return NextResponse.json(
        { error: 'You are already on this plan' },
        { status: 400 }
      )
    }

    // Get new plan details
    const newPlanLimits = getPlanLimits(newPlan)
    const newPlanPrice = getPlanPrice(newPlan)
    const newPlanDetails = SUBSCRIPTION_PLANS[newPlan as keyof typeof SUBSCRIPTION_PLANS]

    // Determine if it's an upgrade or downgrade
    const planOrder = { FREE: 0, STARTER: 1, PROFESSIONAL: 2, ENTERPRISE: 3 }
    const currentPlanOrder = planOrder[currentSubscription.plan as keyof typeof planOrder]
    const newPlanOrder = planOrder[newPlan as keyof typeof planOrder]
    const isUpgrade = newPlanOrder > currentPlanOrder

    // Check if current usage exceeds new plan limits (for downgrades)
    if (!isUpgrade) {
      const usageIssues = []
      
      if (currentSubscription.postsUsed > newPlanLimits.posts) {
        usageIssues.push(`posts (using ${currentSubscription.postsUsed}, new limit ${newPlanLimits.posts})`)
      }
      if (currentSubscription.usersUsed > newPlanLimits.users) {
        usageIssues.push(`users (using ${currentSubscription.usersUsed}, new limit ${newPlanLimits.users})`)
      }
      
      if (usageIssues.length > 0) {
        return NextResponse.json(
          {
            error: 'Cannot downgrade - current usage exceeds new plan limits',
            details: `You are currently using more ${usageIssues.join(' and ')} than the ${newPlanDetails.name} plan allows. Please reduce your usage before downgrading.`,
            currentUsage: {
              posts: currentSubscription.postsUsed,
              users: currentSubscription.usersUsed,
              aiCredits: currentSubscription.aiCreditsUsed
            },
            newLimits: newPlanLimits
          },
          { status: 400 }
        )
      }
    }

    // Calculate new period end (for upgrades, immediate; for downgrades, end of current period)
    const now = new Date()
    let newPeriodEnd = new Date(currentSubscription.currentPeriodEnd || now)
    let newStatus = currentSubscription.status

    if (isUpgrade) {
      // For upgrades, extend period by 1 month from now
      newPeriodEnd = new Date(now)
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1)
      newStatus = 'ACTIVE' // Upgrade activates immediately (in production, after payment)
    } else {
      // For downgrades, keep current period end
      // Changes take effect at end of current billing period
      newStatus = currentSubscription.status
    }

    // Update subscription
    const updatedSubscription = await prisma.subscription.update({
      where: { id: currentSubscription.id },
      data: {
        plan: newPlan,
        status: newStatus,
        amount: newPlanPrice / 100, // Convert cents to dollars
        currentPeriodEnd: newPeriodEnd,
        // Update limits
        postsLimit: newPlanLimits.posts,
        usersLimit: newPlanLimits.users,
        aiCreditsLimit: newPlanLimits.aiCredits,
        // Keep trial end date if exists
        trialEndsAt: currentSubscription.trialEndsAt,
      }
    })

    return NextResponse.json({
      success: true,
      message: isUpgrade
        ? `Successfully upgraded to ${newPlanDetails.name} plan! Your new limits are active immediately.`
        : `Successfully downgraded to ${newPlanDetails.name} plan. Changes will take effect at the end of your current billing period (${newPeriodEnd.toLocaleDateString()}).`,
      subscription: {
        id: updatedSubscription.id,
        plan: updatedSubscription.plan,
        status: updatedSubscription.status,
        amount: updatedSubscription.amount,
        currentPeriodEnd: updatedSubscription.currentPeriodEnd?.toISOString(),
        limits: {
          posts: updatedSubscription.postsLimit,
          users: updatedSubscription.usersLimit,
          aiCredits: updatedSubscription.aiCreditsLimit
        }
      },
      isUpgrade,
      effectiveDate: isUpgrade ? 'immediate' : newPeriodEnd.toISOString()
    })
  } catch (error) {
    console.error('Error changing subscription plan:', error)
    return NextResponse.json(
      { error: 'Failed to change subscription plan', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
