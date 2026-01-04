import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/session-helpers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/media-groups
 * Fetch all media groups for the current tenant
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

    // Fetch media groups with related data
    const groups = await prisma.mediaGroup.findMany({
      where: {
        tenantId: user.tenantId,
      },
      include: {
        syncedMedia: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        posts: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit to 100 most recent
    })

    // Transform data for frontend
    const transformedGroups = groups.map(group => ({
      ...group,
      postId: group.posts && group.posts.length > 0 ? group.posts[0].id : undefined,
      post: group.posts && group.posts.length > 0 ? group.posts[0] : undefined,
    }))

    return NextResponse.json({
      success: true,
      groups: transformedGroups,
      count: groups.length,
    })
  } catch (error: any) {
    console.error('Error fetching media groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media groups', details: error.message },
      { status: 500 }
    )
  }
}
