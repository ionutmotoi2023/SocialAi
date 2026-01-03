import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe/config'
import { prisma } from '@/lib/db'

// Disable body parsing for webhooks (Stripe needs raw body)
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No Stripe signature found' },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  console.log(`[Webhook] Received event: ${event.type}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutSessionCompleted(session)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaid(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error(`[Webhook] Error processing ${event.type}:`, error)
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error.message },
      { status: 500 }
    )
  }
}

// Handle successful checkout
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('[Webhook] Processing checkout.session.completed:', session.id)

  const tenantId = session.metadata?.tenantId
  const subscriptionId = session.metadata?.subscriptionId
  const planId = session.metadata?.planId

  if (!tenantId || !subscriptionId) {
    console.error('[Webhook] Missing metadata in checkout session')
    return
  }

  // Get Stripe subscription
  const stripeSubscriptionId = session.subscription as string
  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)

  // Update our subscription
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'ACTIVE',
      plan: planId || 'PROFESSIONAL',
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: stripeSubscriptionId,
      stripePriceId: stripeSubscription.items.data[0].price.id,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      // Clear trial if exists
      trialEndsAt: null,
    },
  })

  console.log(`[Webhook] Subscription ${subscriptionId} activated for tenant ${tenantId}`)
}

// Handle successful invoice payment
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log('[Webhook] Processing invoice.paid:', invoice.id)

  const stripeSubscriptionId = invoice.subscription as string
  const customerId = invoice.customer as string

  if (!stripeSubscriptionId) {
    console.log('[Webhook] Invoice not linked to subscription, skipping')
    return
  }

  // Find subscription by Stripe subscription ID
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId }
  })

  if (!subscription) {
    console.error(`[Webhook] Subscription not found for Stripe subscription ${stripeSubscriptionId}`)
    return
  }

  // Create invoice record in DB
  await prisma.invoice.create({
    data: {
      subscriptionId: subscription.id,
      invoiceNumber: invoice.number || `INV-${Date.now()}`,
      amount: (invoice.amount_paid || 0) / 100, // Convert cents to dollars
      currency: invoice.currency.toUpperCase(),
      status: 'PAID',
      paidAt: new Date(invoice.status_transition?.paid_at || Date.now() * 1000),
      stripeInvoiceId: invoice.id,
      stripeChargeId: invoice.charge as string || undefined,
      invoiceUrl: invoice.hosted_invoice_url || undefined,
      dueDate: new Date(invoice.due_date ? invoice.due_date * 1000 : Date.now()),
      description: `Subscription payment - ${subscription.plan}`,
    }
  })

  console.log(`[Webhook] Invoice ${invoice.id} recorded for subscription ${subscription.id}`)
}

// Handle failed payment
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('[Webhook] Processing invoice.payment_failed:', invoice.id)

  const stripeSubscriptionId = invoice.subscription as string

  if (!stripeSubscriptionId) {
    return
  }

  // Find subscription
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId }
  })

  if (!subscription) {
    console.error(`[Webhook] Subscription not found for Stripe subscription ${stripeSubscriptionId}`)
    return
  }

  // Update subscription status
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'PAST_DUE',
    }
  })

  // TODO: Send email notification to tenant about failed payment

  console.log(`[Webhook] Subscription ${subscription.id} marked as PAST_DUE due to payment failure`)
}

// Handle subscription updates
async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
  console.log('[Webhook] Processing customer.subscription.updated:', stripeSubscription.id)

  // Find subscription
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: stripeSubscription.id }
  })

  if (!subscription) {
    console.error(`[Webhook] Subscription not found for Stripe subscription ${stripeSubscription.id}`)
    return
  }

  // Update subscription details
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: stripeSubscription.status === 'active' ? 'ACTIVE' : 
             stripeSubscription.status === 'trialing' ? 'TRIAL' :
             stripeSubscription.status === 'past_due' ? 'PAST_DUE' :
             stripeSubscription.status === 'canceled' ? 'CANCELLED' : 'EXPIRED',
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      stripePriceId: stripeSubscription.items.data[0]?.price.id,
      canceledAt: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null,
    }
  })

  console.log(`[Webhook] Subscription ${subscription.id} updated`)
}

// Handle subscription cancellation
async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
  console.log('[Webhook] Processing customer.subscription.deleted:', stripeSubscription.id)

  // Find subscription
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: stripeSubscription.id }
  })

  if (!subscription) {
    console.error(`[Webhook] Subscription not found for Stripe subscription ${stripeSubscription.id}`)
    return
  }

  // Update subscription status
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'CANCELLED',
      canceledAt: new Date(),
    }
  })

  console.log(`[Webhook] Subscription ${subscription.id} cancelled`)
}
