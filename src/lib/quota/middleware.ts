/**
 * Quota Middleware for API Routes
 * 
 * Use this to protect API endpoints and enforce subscription limits
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkQuota, incrementUsage, QuotaType } from '@/lib/quota'
import { prisma } from '@/lib/db'

export interface QuotaMiddlewareOptions {
  quotaType: QuotaType
  amount?: number
  autoIncrement?: boolean
  customErrorMessage?: string
}

/**
 * Middleware to check and enforce quota limits
 * 
 * @example
 * // In your API route
 * const quotaCheck = await withQuotaCheck({
 *   quotaType: 'posts',
 *   amount: 1,
 *   autoIncrement: true
 * })
 * 
 * if (!quotaCheck.allowed) {
 *   return quotaCheck.response
 * }
 * 
 * // Continue with your logic
 * const tenantId = quotaCheck.tenantId
 */
export async function withQuotaCheck(options: QuotaMiddlewareOptions) {
  const {
    quotaType,
    amount = 1,
    autoIncrement = false,
    customErrorMessage
  } = options

  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return {
        allowed: false,
        tenantId: null,
        response: NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    // Get user's tenant
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tenantId: true }
    })

    if (!user || !user.tenantId) {
      return {
        allowed: false,
        tenantId: null,
        response: NextResponse.json(
          { error: 'User has no tenant' },
          { status: 404 }
        )
      }
    }

    const tenantId = user.tenantId

    // Check quota
    const quotaCheck = await checkQuota(tenantId, quotaType, amount)

    if (!quotaCheck.allowed) {
      return {
        allowed: false,
        tenantId,
        quotaCheck,
        response: NextResponse.json(
          {
            error: 'Quota limit reached',
            message: customErrorMessage || quotaCheck.message,
            quota: {
              type: quotaType,
              used: quotaCheck.used,
              limit: quotaCheck.limit,
              remaining: quotaCheck.remaining,
              percentage: quotaCheck.percentage
            },
            upgrade: {
              message: 'Upgrade your plan to continue',
              url: '/pricing'
            }
          },
          { status: 429 } // Too Many Requests
        )
      }
    }

    // Auto-increment usage if enabled
    if (autoIncrement) {
      await incrementUsage(tenantId, quotaType, amount)
    }

    return {
      allowed: true,
      tenantId,
      quotaCheck,
      response: null
    }
  } catch (error) {
    console.error('Quota middleware error:', error)
    return {
      allowed: false,
      tenantId: null,
      response: NextResponse.json(
        { error: 'Failed to check quota' },
        { status: 500 }
      )
    }
  }
}

/**
 * Helper to get tenant ID from session
 */
export async function getTenantIdFromSession(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return null

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tenantId: true }
    })

    return user?.tenantId || null
  } catch (error) {
    console.error('Error getting tenant ID:', error)
    return null
  }
}
