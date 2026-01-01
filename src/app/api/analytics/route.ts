export const dynamic = 'force-dynamic'


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get time range from query params
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7d'

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
        startDate = new Date(0) // Beginning of time
        break
    }

    // Fetch all posts for tenant in range
    const posts = await prisma.post.findMany({
      where: {
        tenantId: session.user.tenantId,
        createdAt: {
          gte: startDate
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate overview metrics
    const totalPosts = posts.length
    const published = posts.filter(p => p.status === 'PUBLISHED').length
    const aiGenerated = posts.filter(p => p.aiGenerated).length
    
    // Calculate average engagement (mock data for now, as we don't have real engagement yet)
    const avgEngagement = published > 0 ? (Math.random() * 5 + 2) : 0

    // Calculate AI accuracy (average confidence)
    const aiPosts = posts.filter(p => p.aiGenerated && p.aiConfidence)
    const aiAccuracy = aiPosts.length > 0
      ? (aiPosts.reduce((sum, p) => sum + (p.aiConfidence || 0), 0) / aiPosts.length) * 100
      : 95 // Default to 95% if no AI posts yet

    // Estimate time saved (assuming 15 minutes per post)
    const timeSaved = Math.round((aiGenerated * 15) / 60)

    // Get this week's posts for trend calculation
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(now.getDate() - 7)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(now.getDate() - 14)

    const postsThisWeek = await prisma.post.count({
      where: {
        tenantId: session.user.tenantId,
        createdAt: {
          gte: oneWeekAgo
        }
      }
    })

    const postsLastWeek = await prisma.post.count({
      where: {
        tenantId: session.user.tenantId,
        createdAt: {
          gte: twoWeeksAgo,
          lt: oneWeekAgo
        }
      }
    })

    // Calculate engagement growth (mock for now)
    const engagementGrowth = postsLastWeek > 0 
      ? ((postsThisWeek - postsLastWeek) / postsLastWeek) * 100 
      : 0

    // Find top performing post (by engagement score, or random for now)
    const publishedPosts = posts.filter(p => p.status === 'PUBLISHED' && p.publishedAt)
    const topPost = publishedPosts.length > 0
      ? publishedPosts.reduce((best, current) => {
          const currentScore = current.engagementScore || Math.random()
          const bestScore = best.engagementScore || 0
          return currentScore > bestScore ? current : best
        })
      : null

    // Get recent posts with engagement data
    const recentPosts = posts.slice(0, 10).map(post => ({
      id: post.id,
      content: post.content,
      status: post.status,
      engagement: Math.floor(Math.random() * 100), // Mock engagement
      aiGenerated: post.aiGenerated,
      publishedAt: post.publishedAt?.toISOString() || null
    }))

    return NextResponse.json({
      overview: {
        totalPosts,
        published,
        avgEngagement,
        timeSaved,
        aiAccuracy
      },
      performance: {
        topPost: topPost ? {
          id: topPost.id,
          content: topPost.content,
          engagement: Math.floor(Math.random() * 200) + 50, // Mock
          publishedAt: topPost.publishedAt?.toISOString() || ''
        } : null,
        recentPosts
      },
      trends: {
        postsThisWeek,
        postsLastWeek,
        engagementGrowth
      }
    })
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
