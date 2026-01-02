export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/ai/insights - Get AI learning insights and statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case 'all':
        startDate = new Date(0)
        break
    }

    // 1. Total user edits
    const totalEdits = await prisma.aILearningData.count({
      where: {
        tenantId: session.user.tenantId,
        interactionType: 'user_edit',
        createdAt: { gte: startDate }
      }
    })

    // 2. AI Accuracy (posts approved without edits vs total AI posts)
    const totalAIPosts = await prisma.post.count({
      where: {
        tenantId: session.user.tenantId,
        aiGenerated: true,
        createdAt: { gte: startDate }
      }
    })

    const aiAccuracy = totalAIPosts > 0
      ? ((totalAIPosts - totalEdits) / totalAIPosts) * 100
      : 95 // Default high accuracy

    // 3. RSS Sources Performance
    const rssSourcesPerformance = await prisma.post.groupBy({
      by: ['contentSourceId'],
      where: {
        tenantId: session.user.tenantId,
        contentSourceId: { not: null },
        createdAt: { gte: startDate }
      },
      _count: { id: true }
    })

    // Get content source details
    const sourcesWithDetails = await Promise.all(
      rssSourcesPerformance.map(async (source) => {
        if (!source.contentSourceId) return null

        const contentSource = await prisma.contentSource.findUnique({
          where: { id: source.contentSourceId }
        })

        // Calculate accuracy for this source (posts without edits)
        const sourcePosts = await prisma.post.findMany({
          where: {
            tenantId: session.user.tenantId,
            contentSourceId: source.contentSourceId,
            createdAt: { gte: startDate }
          },
          select: { id: true }
        })

        const sourceEdits = await prisma.aILearningData.count({
          where: {
            tenantId: session.user.tenantId,
            interactionType: 'user_edit',
            postId: { in: sourcePosts.map(p => p.id) }
          }
        })

        const sourceAccuracy = sourcePosts.length > 0
          ? ((sourcePosts.length - sourceEdits) / sourcePosts.length) * 100
          : 100

        return {
          id: source.contentSourceId,
          name: contentSource?.name || 'Unknown Source',
          url: contentSource?.url || '',
          postsGenerated: source._count.id,
          accuracy: Math.round(sourceAccuracy)
        }
      })
    )

    const topSources = sourcesWithDetails
      .filter(s => s !== null)
      .sort((a, b) => (b?.postsGenerated || 0) - (a?.postsGenerated || 0))
      .slice(0, 5)

    // 4. Recent learnings (user edits)
    const recentLearnings = await prisma.aILearningData.findMany({
      where: {
        tenantId: session.user.tenantId,
        interactionType: 'user_edit',
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        tenant: {
          select: { name: true }
        }
      }
    })

    // 5. Edit patterns analysis
    const editPatterns = {
      totalEdits,
      avgEditLength: 0,
      commonChanges: [] as string[]
    }

    // Calculate average edit length
    const editsWithContent = recentLearnings.filter(
      l => l.originalContent && l.modifiedContent
    )

    if (editsWithContent.length > 0) {
      const totalLengthChange = editsWithContent.reduce((sum, edit) => {
        const originalLen = edit.originalContent?.length || 0
        const modifiedLen = edit.modifiedContent?.length || 0
        return sum + Math.abs(modifiedLen - originalLen)
      }, 0)
      
      editPatterns.avgEditLength = Math.round(totalLengthChange / editsWithContent.length)
    }

    // Analyze common patterns (simple keyword detection)
    const editTexts = editsWithContent.map(e => 
      `${e.originalContent} ${e.modifiedContent}`.toLowerCase()
    ).join(' ')

    if (editTexts.includes('shorter') || editPatterns.avgEditLength < -50) {
      editPatterns.commonChanges.push('Users prefer shorter content (-20% avg length)')
    }
    if (editTexts.includes('professional') || editTexts.includes('formal')) {
      editPatterns.commonChanges.push('Tone adjustments: More professional preferred')
    }
    if (editTexts.includes('hashtag') || editTexts.includes('#')) {
      editPatterns.commonChanges.push('Hashtag modifications: 3-5 hashtags optimal')
    }

    // 6. Content inspiration usage
    const totalInspirations = await prisma.aILearningData.count({
      where: {
        tenantId: session.user.tenantId,
        interactionType: 'content_inspiration',
        createdAt: { gte: startDate }
      }
    })

    const postsFromRSS = await prisma.post.count({
      where: {
        tenantId: session.user.tenantId,
        contentSourceId: { not: null },
        createdAt: { gte: startDate }
      }
    })

    // 7. Trend data (week over week)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(now.getDate() - 7)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(now.getDate() - 14)

    const editsThisWeek = await prisma.aILearningData.count({
      where: {
        tenantId: session.user.tenantId,
        interactionType: 'user_edit',
        createdAt: { gte: oneWeekAgo }
      }
    })

    const editsLastWeek = await prisma.aILearningData.count({
      where: {
        tenantId: session.user.tenantId,
        interactionType: 'user_edit',
        createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo }
      }
    })

    const accuracyTrend = editsLastWeek > 0
      ? ((editsLastWeek - editsThisWeek) / editsLastWeek) * 100
      : 0

    return NextResponse.json({
      overview: {
        totalEdits,
        aiAccuracy: Math.round(aiAccuracy * 10) / 10,
        totalInspirations,
        postsFromRSS,
        accuracyTrend: Math.round(accuracyTrend)
      },
      rssSourcesPerformance: topSources,
      recentLearnings: recentLearnings.map(learning => ({
        id: learning.id,
        date: learning.createdAt,
        type: learning.interactionType,
        originalPreview: learning.originalContent?.substring(0, 100) || '',
        modifiedPreview: learning.modifiedContent?.substring(0, 100) || '',
        feedback: learning.userFeedback,
        postId: learning.postId
      })),
      editPatterns,
      insights: [
        ...editPatterns.commonChanges,
        accuracyTrend > 0 
          ? `AI improving: ${Math.abs(accuracyTrend)}% fewer edits needed`
          : accuracyTrend < 0
          ? `More edits needed: ${Math.abs(accuracyTrend)}% increase`
          : 'AI performance stable',
        postsFromRSS > 0 
          ? `${postsFromRSS} posts inspired by RSS feeds`
          : 'No RSS-inspired posts yet'
      ]
    })
  } catch (error) {
    console.error('Failed to fetch AI insights:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI insights' },
      { status: 500 }
    )
  }
}
