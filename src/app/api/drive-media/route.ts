import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/session-helpers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/drive-media
 * Fetch all synced media for the current tenant
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!user.tenantId) {
      return NextResponse.json(
        { error: 'No tenant found' },
        { status: 404 }
      )
    }

    // Fetch synced media
    const media = await prisma.syncedMedia.findMany({
      where: {
        tenantId: user.tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit to 100 most recent
    })

    return NextResponse.json({
      success: true,
      media,
      count: media.length,
    })
  } catch (error: any) {
    console.error('Error fetching synced media:', error)
    return NextResponse.json(
      { error: 'Failed to fetch synced media', details: error.message },
      { status: 500 }
    )
  }
}
