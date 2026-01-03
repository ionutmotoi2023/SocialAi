import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SUBSCRIPTION_PLANS, SubscriptionPlanType } from '@/lib/subscription-plans'

// GET /api/super-admin/pricing - Fetch current pricing config
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - SUPER_ADMIN access required' }, { status: 403 })
    }

    // Fetch all pricing plans from DB
    const dbPlans = await prisma.pricingPlan.findMany({
      orderBy: { price: 'asc' }
    })

    // Build response: merge DB config with defaults
    const plans = Object.keys(SUBSCRIPTION_PLANS).map(planId => {
      const defaultPlan = SUBSCRIPTION_PLANS[planId as SubscriptionPlanType]
      const dbPlan = dbPlans.find(p => p.planId === planId)

      if (dbPlan) {
        // Use DB config
        return {
          planId: dbPlan.planId,
          name: dbPlan.name,
          description: dbPlan.description,
          price: dbPlan.price,
          priceDisplay: dbPlan.priceDisplay,
          limits: dbPlan.limits as { posts: number; users: number; aiCredits: number },
          features: dbPlan.features,
          isActive: dbPlan.isActive,
          isPopular: dbPlan.isPopular,
          isCustomized: true
        }
      } else {
        // Use default config
        return {
          planId,
          name: defaultPlan.name,
          description: defaultPlan.description,
          price: defaultPlan.price,
          priceDisplay: defaultPlan.priceDisplay,
          limits: defaultPlan.limits,
          features: defaultPlan.features,
          isActive: true,
          isPopular: defaultPlan.popular || false,
          isCustomized: false
        }
      }
    })

    return NextResponse.json({ plans }, { status: 200 })

  } catch (error) {
    console.error('[GET /api/super-admin/pricing] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/super-admin/pricing - Save pricing config
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - SUPER_ADMIN access required' }, { status: 403 })
    }

    const body = await req.json()
    const { planId, name, description, price, priceDisplay, limits, features, isActive, isPopular } = body

    // Validation
    if (!planId || !name || !description || price === undefined || !priceDisplay || !limits || !features) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (price < 0) {
      return NextResponse.json({ error: 'Price must be >= 0' }, { status: 400 })
    }

    if (!limits.posts || !limits.users || !limits.aiCredits) {
      return NextResponse.json({ error: 'Invalid limits structure' }, { status: 400 })
    }

    if (limits.posts < 1 || limits.users < 1 || limits.aiCredits < 1) {
      return NextResponse.json({ error: 'Limits must be > 0' }, { status: 400 })
    }

    if (!Array.isArray(features) || features.length === 0) {
      return NextResponse.json({ error: 'Features must be a non-empty array' }, { status: 400 })
    }

    // Upsert pricing plan
    const updatedPlan = await prisma.pricingPlan.upsert({
      where: { planId },
      update: {
        name,
        description,
        price,
        priceDisplay,
        limits,
        features,
        isActive,
        isPopular,
        updatedAt: new Date()
      },
      create: {
        planId,
        name,
        description,
        price,
        priceDisplay,
        limits,
        features,
        isActive,
        isPopular
      }
    })

    return NextResponse.json({
      message: 'Pricing plan updated successfully',
      plan: updatedPlan
    }, { status: 200 })

  } catch (error) {
    console.error('[POST /api/super-admin/pricing] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/super-admin/pricing - Reset plan to defaults
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - SUPER_ADMIN access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const planId = searchParams.get('planId')

    if (!planId) {
      return NextResponse.json({ error: 'planId is required' }, { status: 400 })
    }

    // Delete custom config (will fall back to defaults)
    await prisma.pricingPlan.delete({
      where: { planId }
    })

    return NextResponse.json({
      message: 'Plan reset to defaults successfully'
    }, { status: 200 })

  } catch (error: any) {
    // Handle case where plan doesn't exist in DB
    if (error.code === 'P2025') {
      return NextResponse.json({
        message: 'Plan already using defaults'
      }, { status: 200 })
    }

    console.error('[DELETE /api/super-admin/pricing] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
