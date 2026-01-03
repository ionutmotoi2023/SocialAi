import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Stripe from 'stripe'

// POST /api/super-admin/stripe/test - Test Stripe connection
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Only super admins can test Stripe connection' },
        { status: 403 }
      )
    }

    const secretKey = process.env.STRIPE_SECRET_KEY

    if (!secretKey) {
      return NextResponse.json(
        { error: 'Stripe secret key not configured' },
        { status: 400 }
      )
    }

    // Initialize Stripe
    const stripe = new Stripe(secretKey, {
      apiVersion: '2024-11-20.acacia',
    })

    // Test connection by retrieving account info
    const account = await stripe.accounts.retrieve()

    return NextResponse.json({
      success: true,
      message: 'Successfully connected to Stripe',
      accountId: account.id,
      accountEmail: account.email,
      accountCountry: account.country,
      testMode: secretKey.startsWith('sk_test_')
    })
  } catch (error: any) {
    console.error('Error testing Stripe connection:', error)
    return NextResponse.json(
      { 
        error: 'Failed to connect to Stripe', 
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
