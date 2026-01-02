export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
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

    // Get AI-generated posts with approval/rejection data
    const aiPosts = await prisma.post.findMany({
      where: {
        ...whereClause,
        aiGenerated: true,
      },
      select: {
        status: true,
        aiConfidence: true,
        aiModel: true, // ✅ Fixed: Use aiModel instead of aiProvider
        createdAt: true,
        updatedAt: true,
      },
    })

    // Calculate approval rate (published vs total AI posts)
    const publishedAIPosts = aiPosts.filter(p => p.status === 'PUBLISHED').length
    const totalAIPosts = aiPosts.length
    const approvalRate = totalAIPosts > 0 
      ? Math.round((publishedAIPosts / totalAIPosts) * 100)
      : 0

    // Calculate average generation time (difference between created and updated)
    // This is a simulation since we don't track actual generation time
    const avgGenerationTime = aiPosts.length > 0
      ? Math.round(
          aiPosts.reduce((sum, post) => {
            const diff = post.updatedAt.getTime() - post.createdAt.getTime()
            return sum + (diff / 1000) // Convert to seconds
          }, 0) / aiPosts.length
        )
      : 0

    // Calculate user satisfaction based on AI confidence scores
    const postsWithConfidence = aiPosts.filter(p => p.aiConfidence !== null)
    const userSatisfaction = postsWithConfidence.length > 0
      ? Math.round(
          (postsWithConfidence.reduce((sum, post) => sum + (post.aiConfidence || 0), 0) /
            postsWithConfidence.length) *
            100
        )
      : 0

    return NextResponse.json({
      approvalRate,
      avgGenerationTime: Math.min(avgGenerationTime, 10), // Cap at 10 seconds for display
      userSatisfaction,
    })
  } catch (error) {
    console.error('AI insights error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI insights' },
      { status: 500 }
    )
  }
}
