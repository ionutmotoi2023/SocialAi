import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/super-admin/stripe/config - Retrieve Stripe configuration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Only super admins can access Stripe configuration' },
        { status: 403 }
      )
    }

    // Read from environment variables
    const config = {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      secretKey: process.env.STRIPE_SECRET_KEY ? '••••••••' : '', // Mask secret key
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? '••••••••' : '', // Mask webhook secret
      priceIds: {
        STARTER: process.env.STRIPE_PRICE_STARTER || '',
        PROFESSIONAL: process.env.STRIPE_PRICE_PROFESSIONAL || '',
        ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE || '',
      },
      testMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || true,
      isConfigured: !!(
        process.env.STRIPE_PUBLISHABLE_KEY && 
        process.env.STRIPE_SECRET_KEY
      )
    }

    return NextResponse.json({
      success: true,
      config
    })
  } catch (error) {
    console.error('Error fetching Stripe config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Stripe configuration' },
      { status: 500 }
    )
  }
}

// POST /api/super-admin/stripe/config - Save Stripe configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Only super admins can update Stripe configuration' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { publishableKey, secretKey, webhookSecret, priceIds } = body

    // NOTE: In production, these should be stored in Railway environment variables
    // or a secure secret management system, NOT in the database in plain text
    
    return NextResponse.json({
      success: true,
      message: 'Configuration received. To apply changes, update your environment variables in Railway:',
      instructions: {
        STRIPE_PUBLISHABLE_KEY: publishableKey,
        STRIPE_SECRET_KEY: secretKey ? '(hidden for security)' : undefined,
        STRIPE_WEBHOOK_SECRET: webhookSecret ? '(hidden for security)' : undefined,
        STRIPE_PRICE_STARTER: priceIds?.STARTER,
        STRIPE_PRICE_PROFESSIONAL: priceIds?.PROFESSIONAL,
        STRIPE_PRICE_ENTERPRISE: priceIds?.ENTERPRISE,
      },
      note: 'These values are not stored in the database. Please add them to your Railway environment variables and redeploy.'
    })
  } catch (error) {
    console.error('Error saving Stripe config:', error)
    return NextResponse.json(
      { error: 'Failed to save Stripe configuration' },
      { status: 500 }
    )
  }
}
