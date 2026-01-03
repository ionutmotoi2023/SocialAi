import { NextResponse } from 'next/server'
import { getPricingPlans } from '@/lib/pricing-utils'

// GET /api/pricing - Public endpoint for fetching pricing plans
// Updated: 2026-01-03 - Using dynamic pricing from database
export async function GET() {
  try {
    const plans = await getPricingPlans()
    
    return NextResponse.json({ plans }, { status: 200 })
  } catch (error) {
    console.error('[GET /api/pricing] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pricing plans' },
      { status: 500 }
    )
  }
}
