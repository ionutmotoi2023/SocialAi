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

    // Fetch all pricing configs from DB
    const dbConfigs = await prisma.pricingConfig.findMany({
      orderBy: { price: 'asc' }
    })

    // Build response: merge DB config with defaults
    const plans = Object.keys(SUBSCRIPTION_PLANS).map(planId => {
      const defaultPlan = SUBSCRIPTION_PLANS[planId as SubscriptionPlanType]
      const dbConfig = dbConfigs.find(p => p.plan === planId)

      if (dbConfig) {
        // Use DB config
        const features = Array.isArray(dbConfig.features) ? dbConfig.features : JSON.parse(dbConfig.features as string)
        return {
          id: dbConfig.id,
          plan: dbConfig.plan,
          name: dbConfig.name,
          description: dbConfig.description,
          price: dbConfig.price,
          priceDisplay: dbConfig.priceDisplay,
          postsLimit: dbConfig.postsLimit,
          usersLimit: dbConfig.usersLimit,
          aiCreditsLimit: dbConfig.aiCreditsLimit,
          features: features,
          popular: dbConfig.popular,
          isCustomized: true
        }
      } else {
        // Use default config
        return {
          plan: planId,
          name: defaultPlan.name,
          description: defaultPlan.description,
          price: defaultPlan.price,
          priceDisplay: defaultPlan.priceDisplay,
          postsLimit: defaultPlan.limits.posts,
          usersLimit: defaultPlan.limits.users,
          aiCreditsLimit: defaultPlan.limits.aiCredits,
          features: defaultPlan.features,
          popular: defaultPlan.popular || false,
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

    // Upsert pricing config
    const updatedPlan = await prisma.pricingConfig.upsert({
      where: { plan: planId },
      update: {
        name,
        description,
        price,
        priceDisplay,
        postsLimit: limits.posts,
        usersLimit: limits.users,
        aiCreditsLimit: limits.aiCredits,
        features: features,
        popular: isPopular,
        updatedAt: new Date()
      },
      create: {
        plan: planId,
        name,
        description,
        price,
        priceDisplay,
        postsLimit: limits.posts,
        usersLimit: limits.users,
        aiCreditsLimit: limits.aiCredits,
        features: features,
        popular: isPopular
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
    await prisma.pricingConfig.delete({
      where: { plan: planId }
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
