export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Parser from 'rss-parser'

// POST /api/content-sources/fetch - Fetch and parse RSS feeds
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sourceId } = await request.json()

    if (!sourceId) {
      return NextResponse.json(
        { error: 'Source ID is required' },
        { status: 400 }
      )
    }

    // Get content source
    const source = await prisma.contentSource.findFirst({
      where: {
        id: sourceId,
        tenantId: session.user.tenantId,
      },
    })

    if (!source) {
      return NextResponse.json(
        { error: 'Content source not found' },
        { status: 404 }
      )
    }

    if (source.type !== 'rss') {
      return NextResponse.json(
        { error: 'Source must be of type RSS' },
        { status: 400 }
      )
    }

    // Parse RSS feed
    const parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ContentBot/1.0)',
      },
    })

    let feed
    try {
      feed = await parser.parseURL(source.url)
    } catch (error: any) {
      console.error('RSS parse error:', error)
      return NextResponse.json(
        { error: `Failed to parse RSS feed: ${error.message}` },
        { status: 500 }
      )
    }

    // Filter items by keywords if set
    const settings = source.settings as any
    const keywords = settings?.keywords || []
    
    let items = feed.items || []
    
    // Apply keyword filter if keywords are set
    if (keywords.length > 0) {
      items = items.filter(item => {
        const text = `${item.title} ${item.contentSnippet || item.content || ''}`.toLowerCase()
        return keywords.some((keyword: string) => 
          text.includes(keyword.toLowerCase())
        )
      })
    }

    // Limit to 10 most recent items
    items = items.slice(0, 10)

    // Store as learning data for AI inspiration
    const savedCount = []
    for (const item of items) {
      try {
        const contentPreview = item.contentSnippet || item.content || item.title
        
        const saved = await prisma.aILearningData.create({
          data: {
            tenantId: session.user.tenantId,
            interactionType: 'content_inspiration',
            originalContent: contentPreview?.substring(0, 2000),
            patternDetected: `RSS: ${feed.title} - ${item.title}`,
            userFeedback: `Source: ${source.name}`,
          },
        })
        savedCount.push(saved)
      } catch (error) {
        console.error('Failed to save RSS item:', error)
      }
    }

    // Update lastChecked
    await prisma.contentSource.update({
      where: { id: sourceId },
      data: { lastChecked: new Date() },
    })

    return NextResponse.json({
      success: true,
      feedTitle: feed.title,
      feedDescription: feed.description,
      totalItems: feed.items?.length || 0,
      filteredItems: items.length,
      savedForAI: savedCount.length,
      items: items.map(item => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        contentSnippet: item.contentSnippet?.substring(0, 200),
      })),
      message: `Fetched ${items.length} items from ${feed.title}. Saved ${savedCount.length} for AI training.`,
    })
  } catch (error: any) {
    console.error('Fetch RSS error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch RSS feed' },
      { status: 500 }
    )
  }
}

// GET /api/content-sources/fetch - Get recent content inspiration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get recent content inspiration (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const inspiration = await prisma.aILearningData.findMany({
      where: {
        tenantId: session.user.tenantId,
        interactionType: 'content_inspiration',
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({
      inspiration,
      count: inspiration.length,
    })
  } catch (error: any) {
    console.error('Get inspiration error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content inspiration' },
      { status: 500 }
    )
  }
}
