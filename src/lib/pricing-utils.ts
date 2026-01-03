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
    // Fetch custom pricing from DB (using PricingConfig model)
    const dbConfigs = await prisma.pricingConfig.findMany({
      orderBy: { price: 'asc' }
    })

    // Build final plans list
    const plans: PricingPlan[] = Object.keys(SUBSCRIPTION_PLANS).map(planId => {
      const defaultPlan = SUBSCRIPTION_PLANS[planId as SubscriptionPlanType]
      const dbConfig = dbConfigs.find(p => p.plan === planId)

      if (dbConfig) {
        // Use DB config (override)
        return {
          planId: dbConfig.plan,
          name: dbConfig.name,
          description: dbConfig.description,
          price: dbConfig.price,
          priceDisplay: dbConfig.priceDisplay,
          limits: {
            posts: dbConfig.postsLimit,
            users: dbConfig.usersLimit,
            aiCredits: dbConfig.aiCreditsLimit
          },
          features: Array.isArray(dbConfig.features) ? dbConfig.features : JSON.parse(dbConfig.features as string),
          isActive: true,
          isPopular: dbConfig.popular
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
    const dbConfig = await prisma.pricingConfig.findUnique({
      where: { plan: planId }
    })

    const defaultPlan = SUBSCRIPTION_PLANS[planId]

    if (dbConfig) {
      return {
        planId: dbConfig.plan,
        name: dbConfig.name,
        description: dbConfig.description,
        price: dbConfig.price,
        priceDisplay: dbConfig.priceDisplay,
        limits: {
          posts: dbConfig.postsLimit,
          users: dbConfig.usersLimit,
          aiCredits: dbConfig.aiCreditsLimit
        },
        features: Array.isArray(dbConfig.features) ? dbConfig.features : JSON.parse(dbConfig.features as string),
        isActive: true,
        isPopular: dbConfig.popular
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
