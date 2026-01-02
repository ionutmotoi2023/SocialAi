import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
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

    // Fetch subscription for this tenant
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: user.tenantId }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found for this tenant' },
        { status: 404 }
      )
    }

    // Format response
    const formattedSubscription = {
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      amount: subscription.amount,
      billingCycle: subscription.billingCycle,
      currentPeriodStart: subscription.currentPeriodStart.toISOString(),
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString(),
      trialEndsAt: subscription.trialEndsAt?.toISOString(),
      canceledAt: subscription.canceledAt?.toISOString(),
      
      // Usage limits
      postsLimit: subscription.postsLimit,
      usersLimit: subscription.usersLimit,
      aiCreditsLimit: subscription.aiCreditsLimit,
      
      // Current usage
      postsUsed: subscription.postsUsed,
      usersUsed: subscription.usersUsed,
      aiCreditsUsed: subscription.aiCreditsUsed,
    }

    return NextResponse.json({
      success: true,
      subscription: formattedSubscription,
    })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
