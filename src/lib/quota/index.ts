/**
 * Quota Management Utilities
 * 
 * Handles subscription quota checking, usage tracking, and limit enforcement
 */

import { prisma } from '@/lib/db'

export type QuotaType = 'posts' | 'users' | 'aiCredits'

export interface QuotaCheck {
  allowed: boolean
  remaining: number
  limit: number
  used: number
  percentage: number
  message?: string
}

export interface UsageStats {
  posts: { used: number; limit: number; percentage: number }
  users: { used: number; limit: number; percentage: number }
  aiCredits: { used: number; limit: number; percentage: number }
}

/**
 * Check if tenant has quota available for a specific resource
 */
export async function checkQuota(
  tenantId: string,
  quotaType: QuotaType,
  amount: number = 1
): Promise<QuotaCheck> {
  try {
    // Fetch tenant's subscription
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId }
    })

    if (!subscription) {
      return {
        allowed: false,
        remaining: 0,
        limit: 0,
        used: 0,
        percentage: 100,
        message: 'No active subscription found'
      }
    }

    // Get current usage and limit based on quota type
    let used = 0
    let limit = 0

    switch (quotaType) {
      case 'posts':
        used = subscription.postsUsed
        limit = subscription.postsLimit
        break
      case 'users':
        used = subscription.usersUsed
        limit = subscription.usersLimit
        break
      case 'aiCredits':
        used = subscription.aiCreditsUsed
        limit = subscription.aiCreditsLimit
        break
    }

    const remaining = Math.max(0, limit - used)
    const percentage = limit > 0 ? (used / limit) * 100 : 0
    const allowed = remaining >= amount

    return {
      allowed,
      remaining,
      limit,
      used,
      percentage,
      message: allowed 
        ? undefined 
        : `You've reached your ${quotaType} limit (${used}/${limit}). Please upgrade your plan.`
    }
  } catch (error) {
    console.error('Error checking quota:', error)
    return {
      allowed: false,
      remaining: 0,
      limit: 0,
      used: 0,
      percentage: 100,
      message: 'Failed to check quota. Please try again.'
    }
  }
}

/**
 * Increment usage for a specific quota type
 */
export async function incrementUsage(
  tenantId: string,
  quotaType: QuotaType,
  amount: number = 1
): Promise<boolean> {
  try {
    const updateData: any = {}

    switch (quotaType) {
      case 'posts':
        updateData.postsUsed = { increment: amount }
        break
      case 'users':
        updateData.usersUsed = { increment: amount }
        break
      case 'aiCredits':
        updateData.aiCreditsUsed = { increment: amount }
        break
    }

    await prisma.subscription.update({
      where: { tenantId },
      data: updateData
    })

    return true
  } catch (error) {
    console.error('Error incrementing usage:', error)
    return false
  }
}

/**
 * Decrement usage for a specific quota type (e.g., when deleting)
 */
export async function decrementUsage(
  tenantId: string,
  quotaType: QuotaType,
  amount: number = 1
): Promise<boolean> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId }
    })

    if (!subscription) return false

    const updateData: any = {}

    switch (quotaType) {
      case 'posts':
        // Don't go below 0
        updateData.postsUsed = Math.max(0, subscription.postsUsed - amount)
        break
      case 'users':
        updateData.usersUsed = Math.max(0, subscription.usersUsed - amount)
        break
      case 'aiCredits':
        updateData.aiCreditsUsed = Math.max(0, subscription.aiCreditsUsed - amount)
        break
    }

    await prisma.subscription.update({
      where: { tenantId },
      data: updateData
    })

    return true
  } catch (error) {
    console.error('Error decrementing usage:', error)
    return false
  }
}

/**
 * Get all usage statistics for a tenant
 */
export async function getUsageStats(tenantId: string): Promise<UsageStats | null> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId }
    })

    if (!subscription) return null

    return {
      posts: {
        used: subscription.postsUsed,
        limit: subscription.postsLimit,
        percentage: subscription.postsLimit > 0 
          ? (subscription.postsUsed / subscription.postsLimit) * 100 
          : 0
      },
      users: {
        used: subscription.usersUsed,
        limit: subscription.usersLimit,
        percentage: subscription.usersLimit > 0 
          ? (subscription.usersUsed / subscription.usersLimit) * 100 
          : 0
      },
      aiCredits: {
        used: subscription.aiCreditsUsed,
        limit: subscription.aiCreditsLimit,
        percentage: subscription.aiCreditsLimit > 0 
          ? (subscription.aiCreditsUsed / subscription.aiCreditsLimit) * 100 
          : 0
      }
    }
  } catch (error) {
    console.error('Error getting usage stats:', error)
    return null
  }
}

/**
 * Check if tenant is approaching quota limit (>= 80%)
 */
export async function isApproachingLimit(
  tenantId: string,
  quotaType: QuotaType
): Promise<boolean> {
  const check = await checkQuota(tenantId, quotaType, 0)
  return check.percentage >= 80
}

/**
 * Check if tenant has exceeded quota limit (>= 100%)
 */
export async function hasExceededLimit(
  tenantId: string,
  quotaType: QuotaType
): Promise<boolean> {
  const check = await checkQuota(tenantId, quotaType, 0)
  return check.percentage >= 100
}

/**
 * Reset monthly usage (called by a cron job)
 */
export async function resetMonthlyUsage(tenantId: string): Promise<boolean> {
  try {
    await prisma.subscription.update({
      where: { tenantId },
      data: {
        postsUsed: 0,
        aiCreditsUsed: 0,
        usageResetAt: new Date()
      }
    })

    return true
  } catch (error) {
    console.error('Error resetting monthly usage:', error)
    return false
  }
}
