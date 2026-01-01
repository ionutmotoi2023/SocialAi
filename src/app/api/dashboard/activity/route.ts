export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const tenantId = session.user.tenantId

    // Get recent posts and activities
    const recentPosts = await prisma.post.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        scheduledAt: true,
        publishedAt: true,
      },
    })

    // Transform posts into activity items
    const activities = recentPosts.map((post) => {
      let type: 'created' | 'scheduled' | 'published' | 'approved' | 'rejected' = 'created'
      
      if (post.status === 'PUBLISHED') {
        type = 'published'
      } else if (post.status === 'SCHEDULED') {
        type = 'scheduled'
      } else if (post.status === 'APPROVED') {
        type = 'approved'
      } else if (post.status === 'FAILED') {
        type = 'rejected'
      }

      return {
        id: post.id,
        type,
        title: post.title || 'Untitled Post',
        timestamp: post.publishedAt || post.scheduledAt || post.updatedAt || post.createdAt,
        status: post.status,
      }
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Dashboard activity error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}
