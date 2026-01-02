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

    // Check if user is SUPER_ADMIN
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all subscriptions with tenant info
    const subscriptions = await prisma.subscription.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            domain: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format response
    const formattedSubscriptions = subscriptions.map(sub => ({
      id: sub.id,
      tenantId: sub.tenantId,
      tenantName: sub.tenant.name,
      tenantDomain: sub.tenant.domain,
      plan: sub.plan,
      status: sub.status,
      amount: sub.monthlyAmount / 100, // Convert cents to dollars
      billingCycle: 'monthly', // Assuming monthly for now
    }))

    return NextResponse.json({
      success: true,
      subscriptions: formattedSubscriptions,
    })
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
