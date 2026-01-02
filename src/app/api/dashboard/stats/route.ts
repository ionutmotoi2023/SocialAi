import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // For SUPER_ADMIN, show platform-wide stats
    // For other roles, show tenant-specific stats
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const tenantId = isSuperAdmin ? undefined : session.user.tenantId

    // Build where clause based on role
    const whereClause = tenantId ? { tenantId } : {}

    // Fetch all stats in parallel
    const [
      totalPosts,
      scheduledPosts,
      publishedPosts,
      aiGeneratedPosts,
      avgConfidence,
    ] = await Promise.all([
      // Total posts
      prisma.post.count({
        where: whereClause,
      }),
      
      // Scheduled posts
      prisma.post.count({
        where: {
          ...whereClause,
          status: 'SCHEDULED',
        },
      }),
      
      // Published posts
      prisma.post.count({
        where: {
          ...whereClause,
          status: 'PUBLISHED',
        },
      }),
      
      // AI Generated posts
      prisma.post.count({
        where: {
          ...whereClause,
          aiGenerated: true,
        },
      }),
      
      // Average AI confidence
      prisma.post.aggregate({
        where: {
          ...whereClause,
          aiGenerated: true,
          aiConfidence: {
            not: null,
          },
        },
        _avg: {
          aiConfidence: true,
        },
      }),
    ])

    // Calculate average confidence as percentage
    const averageConfidence = avgConfidence._avg.aiConfidence
      ? Math.round(avgConfidence._avg.aiConfidence * 100)
      : 0

    // Estimate time saved (5 minutes per AI-generated post)
    const timesSaved = Math.round((aiGeneratedPosts * 5) / 60) // Convert minutes to hours

    return NextResponse.json({
      totalPosts,
      scheduledPosts,
      publishedPosts,
      aiGeneratedPosts,
      averageConfidence,
      timesSaved,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
