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

    const tenantId = session.user.tenantId

    // Get stats from database
    const [
      totalPosts,
      scheduledPosts,
      publishedPosts,
      aiGeneratedPosts,
    ] = await Promise.all([
      prisma.post.count({
        where: { tenantId },
      }),
      prisma.post.count({
        where: {
          tenantId,
          status: 'SCHEDULED',
        },
      }),
      prisma.post.count({
        where: {
          tenantId,
          status: 'PUBLISHED',
        },
      }),
      prisma.post.count({
        where: {
          tenantId,
          aiGenerated: true,
        },
      }),
    ])

    // Calculate average confidence for AI-generated posts
    const aiPosts = await prisma.post.findMany({
      where: {
        tenantId,
        aiGenerated: true,
        aiConfidence: { not: null },
      },
      select: {
        aiConfidence: true,
      },
    })

    const averageConfidence = aiPosts.length > 0
      ? Math.round(
          (aiPosts.reduce((sum, post) => sum + (post.aiConfidence || 0), 0) /
            aiPosts.length) *
            100
        )
      : 0

    // Estimate time saved (assuming 15 minutes per AI-generated post)
    const timesSaved = Math.round((aiGeneratedPosts * 15) / 60) // Convert to hours

    return NextResponse.json({
      totalPosts,
      scheduledPosts,
      publishedPosts,
      aiGeneratedPosts,
      averageConfidence,
      timesSaved,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
