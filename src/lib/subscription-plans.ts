/**
 * Subscription Plans Configuration
 * 
 * Defines all available subscription plans with their features and pricing.
 * Used throughout the app for billing, quota checks, and feature access.
 */

export type SubscriptionPlanType = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'

export interface PlanLimits {
  posts: number
  users: number
  aiCredits: number
}

export interface PlanFeatures {
  name: string
  description: string
  price: number // in cents (e.g., 2900 = $29.00)
  priceDisplay: string // e.g., "$29/month"
  limits: PlanLimits
  features: string[]
  popular?: boolean
  stripePriceId?: string // For production Stripe integration
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanType, PlanFeatures> = {
  FREE: {
    name: 'Free',
    description: 'Perfect for trying out the platform',
    price: 0,
    priceDisplay: 'Free',
    limits: {
      posts: 5,
      users: 1,
      aiCredits: 10,
    },
    features: [
      '5 posts per month',
      '1 user',
      '10 AI credits',
      'Basic AI models',
      'LinkedIn integration',
      'Email support',
    ],
  },
  
  STARTER: {
    name: 'Starter',
    description: 'Great for small teams getting started',
    price: 2900, // $29.00
    priceDisplay: '$29/month',
    limits: {
      posts: 50,
      users: 3,
      aiCredits: 500,
    },
    features: [
      '50 posts per month',
      '3 users',
      '500 AI credits',
      'All AI models (GPT-4, Claude, Gemini)',
      'Auto-Pilot mode',
      'Brand training',
      'Content sources (RSS)',
      'Priority email support',
    ],
  },
  
  PROFESSIONAL: {
    name: 'Professional',
    description: 'For growing businesses and teams',
    price: 9900, // $99.00
    priceDisplay: '$99/month',
    limits: {
      posts: 200,
      users: 10,
      aiCredits: 2000,
    },
    features: [
      '200 posts per month',
      '10 users',
      '2,000 AI credits',
      'All AI models (GPT-4, Claude, Gemini)',
      'Auto-Pilot mode',
      'Advanced brand training',
      'Unlimited content sources',
      'Brand assets & watermarks',
      'Analytics dashboard',
      'Team collaboration',
      'Priority support',
    ],
    popular: true, // Most popular badge
  },
  
  ENTERPRISE: {
    name: 'Enterprise',
    description: 'Custom solutions for large organizations',
    price: 29900, // $299.00
    priceDisplay: '$299/month',
    limits: {
      posts: 9999, // "Unlimited" in practice
      users: 9999,
      aiCredits: 9999,
    },
    features: [
      'Unlimited posts',
      'Unlimited users',
      'Unlimited AI credits',
      'All features included',
      'Custom AI model fine-tuning',
      'White-label options',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantees',
      '24/7 phone support',
    ],
  },
}

/**
 * Get plan limits for a given subscription plan
 */
export function getPlanLimits(plan: SubscriptionPlanType): PlanLimits {
  return SUBSCRIPTION_PLANS[plan].limits
}

/**
 * Get plan price in cents
 */
export function getPlanPrice(plan: SubscriptionPlanType): number {
  return SUBSCRIPTION_PLANS[plan].price
}

/**
 * Get plan price display string
 */
export function getPlanPriceDisplay(plan: SubscriptionPlanType): string {
  return SUBSCRIPTION_PLANS[plan].priceDisplay
}

/**
 * Check if a plan has a specific feature (by feature description)
 */
export function planHasFeature(plan: SubscriptionPlanType, feature: string): boolean {
  return SUBSCRIPTION_PLANS[plan].features.some(f => 
    f.toLowerCase().includes(feature.toLowerCase())
  )
}

/**
 * Get all plans sorted by price
 */
export function getAllPlans(): PlanFeatures[] {
  return Object.values(SUBSCRIPTION_PLANS)
}

/**
 * Calculate usage percentage
 */
export function calculateUsagePercentage(used: number, limit: number): number {
  if (limit === 0) return 0
  return Math.round((used / limit) * 100)
}

/**
 * Check if usage is approaching limit (>= 80%)
 */
export function isApproachingLimit(used: number, limit: number): boolean {
  return calculateUsagePercentage(used, limit) >= 80
}

/**
 * Check if usage has exceeded limit
 */
export function hasExceededLimit(used: number, limit: number): boolean {
  return used >= limit
}

/**
 * Get color for usage indicator
 */
export function getUsageColor(used: number, limit: number): 'green' | 'yellow' | 'red' {
  const percentage = calculateUsagePercentage(used, limit)
  if (percentage >= 100) return 'red'
  if (percentage >= 80) return 'yellow'
  return 'green'
}

/**
 * Format price in cents to display string
 */
export function formatPrice(cents: number, currency: string = 'USD'): string {
  const dollars = cents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(dollars)
}

/**
 * Calculate MRR (Monthly Recurring Revenue) from subscriptions
 */
export function calculateMRR(subscriptions: { plan: SubscriptionPlanType; status: string }[]): number {
  return subscriptions
    .filter(sub => sub.status === 'ACTIVE' || sub.status === 'TRIAL')
    .reduce((total, sub) => total + getPlanPrice(sub.plan), 0)
}

/**
 * Calculate ARR (Annual Recurring Revenue)
 */
export function calculateARR(mrr: number): number {
  return mrr * 12
}
