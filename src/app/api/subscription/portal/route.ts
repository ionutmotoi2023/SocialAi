import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { stripe, isStripeConfigured } from '@/lib/stripe/config'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      )
    }

    // Get user's tenant
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        tenant: {
          include: {
            subscriptions: true
          }
        }
      }
    })

    if (!user || !user.tenantId || !user.tenant) {
      return NextResponse.json(
        { error: 'User has no tenant' },
        { status: 404 }
      )
    }

    // Only TENANT_ADMIN can access billing portal
    if (user.role !== 'TENANT_ADMIN') {
      return NextResponse.json(
        { error: 'Only tenant admins can access billing portal' },
        { status: 403 }
      )
    }

    const subscription = user.tenant.subscriptions[0]
    if (!subscription || !subscription.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found. Please upgrade to a paid plan first.' },
        { status: 404 }
      )
    }

    // Determine return URL
    const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const returnUrl = `${origin}/dashboard/settings/billing`

    // Create Billing Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl,
    })

    return NextResponse.json({
      success: true,
      url: portalSession.url,
    })
  } catch (error: any) {
    console.error('Error creating billing portal session:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create billing portal session', 
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
