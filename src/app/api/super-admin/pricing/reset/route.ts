import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

// POST /api/super-admin/pricing/reset - Reset all pricing to defaults
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - SUPER_ADMIN access required' }, { status: 403 })
    }

    // Delete all custom pricing configs
    // This will make the app fall back to defaults in subscription-plans.ts
    await prisma.pricingConfig.deleteMany({})

    // Revalidate all pricing-related pages to clear cache
    revalidatePath('/pricing')
    revalidatePath('/api/pricing')
    revalidatePath('/dashboard/super-admin/pricing')

    return NextResponse.json({
      message: 'All pricing configurations reset to defaults successfully',
      timestamp: new Date().toISOString()
    }, { status: 200 })

  } catch (error) {
    console.error('[POST /api/super-admin/pricing/reset] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
