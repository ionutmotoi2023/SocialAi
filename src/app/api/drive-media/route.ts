import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/drive-media
 * Fetch all synced media for the current tenant
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's tenant - handle both email and id from session
    const userId = (session.user as any).id || (session.user as any).email
    
    const user = await prisma.user.findFirst({
      where: userId.includes('@') 
        ? { email: userId }
        : { id: userId },
      include: { tenant: true },
    })

    if (!user || !user.tenantId) {
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
