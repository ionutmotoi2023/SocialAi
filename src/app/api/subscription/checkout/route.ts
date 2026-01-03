import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { stripe, getStripePriceId, isStripeConfigured } from '@/lib/stripe/config'

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
        { error: 'Stripe is not configured. Please contact support.' },
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

    // Only TENANT_ADMIN can create checkout sessions
    if (user.role !== 'TENANT_ADMIN') {
      return NextResponse.json(
        { error: 'Only tenant admins can manage subscriptions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { planId } = body

    // Validate plan
    const validPlans = ['STARTER', 'PROFESSIONAL', 'ENTERPRISE']
    if (!validPlans.includes(planId)) {
      return NextResponse.json(
        { error: `Invalid plan. Must be one of: ${validPlans.join(', ')}` },
        { status: 400 }
      )
    }

    // Get Price ID for the plan
    const priceId = getStripePriceId(planId)
    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID not configured for ${planId} plan. Please contact support.` },
        { status: 400 }
      )
    }

    // Get or create subscription
    let subscription = user.tenant.subscriptions[0]
    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      )
    }

    // Get or create Stripe customer
    let customerId = subscription.stripeCustomerId

    if (!customerId) {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.tenant.name,
        metadata: {
          tenantId: user.tenantId,
          userId: user.id,
        }
      })

      customerId = customer.id

      // Update subscription with customer ID
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { stripeCustomerId: customerId }
      })
    }

    // Determine success and cancel URLs
    const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const successUrl = `${origin}/dashboard/settings/billing?success=true&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${origin}/dashboard/settings/billing?canceled=true`

    // Create Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        tenantId: user.tenantId,
        userId: user.id,
        subscriptionId: subscription.id,
        planId: planId,
      },
      subscription_data: {
        metadata: {
          tenantId: user.tenantId,
          subscriptionId: subscription.id,
        }
      },
      // Allow promotion codes (discount)
      allow_promotion_codes: true,
      // Billing address collection
      billing_address_collection: 'required',
    })

    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session', 
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
