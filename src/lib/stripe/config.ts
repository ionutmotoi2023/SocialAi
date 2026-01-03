import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

// Server-side Stripe instance (lazy-loaded)
export function getStripe(): Stripe {
  if (!stripeInstance) {
    const apiKey = process.env.STRIPE_SECRET_KEY
    
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    
    stripeInstance = new Stripe(apiKey, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    })
  }
  
  return stripeInstance
}

// Legacy export for backward compatibility (will throw if not configured)
export const stripe = new Proxy({} as Stripe, {
  get(target, prop) {
    return getStripe()[prop as keyof Stripe]
  }
})

// Get Price ID for a plan
export function getStripePriceId(plan: string): string | undefined {
  const priceIds: Record<string, string | undefined> = {
    STARTER: process.env.STRIPE_PRICE_STARTER,
    PROFESSIONAL: process.env.STRIPE_PRICE_PROFESSIONAL,
    ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE,
  }
  
  return priceIds[plan]
}

// Check if Stripe is configured
export function isStripeConfigured(): boolean {
  return !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_PUBLISHABLE_KEY
  )
}
