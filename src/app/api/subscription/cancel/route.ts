import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST() {
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

    // Only TENANT_ADMIN can cancel subscription
    if (user.role !== 'TENANT_ADMIN') {
      return NextResponse.json(
        { error: 'Only tenant admins can cancel subscriptions' },
        { status: 403 }
      )
    }

    // Fetch subscription
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: user.tenantId }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      )
    }

    // Can't cancel a FREE plan
    if (subscription.plan === 'FREE') {
      return NextResponse.json(
        { error: 'Cannot cancel a FREE plan' },
        { status: 400 }
      )
    }

    // Can't cancel if already canceled
    if (subscription.status === 'CANCELED') {
      return NextResponse.json(
        { error: 'Subscription is already canceled' },
        { status: 400 }
      )
    }

    // Update subscription to canceled
    // In production, this would also cancel the Stripe subscription
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
        // Keep access until end of current period
        // endDate is already set to currentPeriodEnd
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription canceled successfully. You will retain access until the end of your current billing period.',
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        canceledAt: updatedSubscription.canceledAt?.toISOString(),
      }
    })
  } catch (error) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
