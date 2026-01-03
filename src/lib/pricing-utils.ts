import { prisma } from '@/lib/prisma'
import { SUBSCRIPTION_PLANS, SubscriptionPlanType } from '@/lib/subscription-plans'

export interface PricingPlan {
  planId: string
  name: string
  description: string
  price: number
  priceDisplay: string
  limits: {
    posts: number
    users: number
    aiCredits: number
  }
  features: string[]
  isActive: boolean
  isPopular: boolean
}

/**
 * Get pricing plans with DB override support
 * Priority: DB config > subscription-plans.ts defaults
 */
export async function getPricingPlans(): Promise<PricingPlan[]> {
  try {
    // Fetch custom pricing from DB
    const dbPlans = await prisma.pricingPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    })

    // Build final plans list
    const plans: PricingPlan[] = Object.keys(SUBSCRIPTION_PLANS).map(planId => {
      const defaultPlan = SUBSCRIPTION_PLANS[planId as SubscriptionPlanType]
      const dbPlan = dbPlans.find(p => p.planId === planId)

      if (dbPlan) {
        // Use DB config (override)
        return {
          planId: dbPlan.planId,
          name: dbPlan.name,
          description: dbPlan.description,
          price: dbPlan.price,
          priceDisplay: dbPlan.priceDisplay,
          limits: dbPlan.limits as { posts: number; users: number; aiCredits: number },
          features: dbPlan.features,
          isActive: dbPlan.isActive,
          isPopular: dbPlan.isPopular
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
          isPopular: defaultPlan.popular || false
        }
      }
    })

    return plans

  } catch (error) {
    console.error('[getPricingPlans] Error fetching pricing:', error)
    // Fallback to defaults on error
    return Object.keys(SUBSCRIPTION_PLANS).map(planId => {
      const defaultPlan = SUBSCRIPTION_PLANS[planId as SubscriptionPlanType]
      return {
        planId,
        name: defaultPlan.name,
        description: defaultPlan.description,
        price: defaultPlan.price,
        priceDisplay: defaultPlan.priceDisplay,
        limits: defaultPlan.limits,
        features: defaultPlan.features,
        isActive: true,
        isPopular: defaultPlan.popular || false
      }
    })
  }
}

/**
 * Get a single pricing plan with DB override support
 */
export async function getPricingPlan(planId: SubscriptionPlanType): Promise<PricingPlan | null> {
  try {
    const dbPlan = await prisma.pricingPlan.findUnique({
      where: { planId }
    })

    const defaultPlan = SUBSCRIPTION_PLANS[planId]

    if (dbPlan && dbPlan.isActive) {
      return {
        planId: dbPlan.planId,
        name: dbPlan.name,
        description: dbPlan.description,
        price: dbPlan.price,
        priceDisplay: dbPlan.priceDisplay,
        limits: dbPlan.limits as { posts: number; users: number; aiCredits: number },
        features: dbPlan.features,
        isActive: dbPlan.isActive,
        isPopular: dbPlan.isPopular
      }
    }

    // Return default
    return {
      planId,
      name: defaultPlan.name,
      description: defaultPlan.description,
      price: defaultPlan.price,
      priceDisplay: defaultPlan.priceDisplay,
      limits: defaultPlan.limits,
      features: defaultPlan.features,
      isActive: true,
      isPopular: defaultPlan.popular || false
    }

  } catch (error) {
    console.error(`[getPricingPlan] Error fetching plan ${planId}:`, error)
    // Fallback to default
    const defaultPlan = SUBSCRIPTION_PLANS[planId]
    return {
      planId,
      name: defaultPlan.name,
      description: defaultPlan.description,
      price: defaultPlan.price,
      priceDisplay: defaultPlan.priceDisplay,
      limits: defaultPlan.limits,
      features: defaultPlan.features,
      isActive: true,
      isPopular: defaultPlan.popular || false
    }
  }
}
