export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import axios from 'axios'
import { parse } from 'node-html-parser'

interface ScrapedContent {
  title: string
  content: string
  category: string
}

// POST /api/brand/scrape - Scrape website for brand training
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ SUPER_ADMIN should NOT access tenant brand scraping directly
    if (session.user.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Super Admin should use Super Admin dashboard to manage tenants' },
        { status: 403 }
      )
    }

    // Check permissions - only tenant admins can scrape
    if (session.user.role !== 'TENANT_ADMIN') {
      return NextResponse.json(
        { error: 'Only tenant admins can configure brand training' },
        { status: 403 }
      )
    }

    // Ensure user has tenantId
    if (!session.user.tenantId) {
      return NextResponse.json(
        { error: 'User not associated with a tenant' },
        { status: 403 }
      )
    }

    const { websiteUrl } = await request.json()

    if (!websiteUrl) {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      )
    }

    // Validate URL
    let url: URL
    try {
      url = new URL(websiteUrl)
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Fetch website content
    let html: string
    try {
      const response = await axios.get(url.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BrandBot/1.0; +https://yourapp.com/bot)',
        },
        timeout: 10000, // 10 seconds timeout
        maxRedirects: 5,
      })
      html = response.data
    } catch (error: any) {
      console.error('Failed to fetch website:', error.message)
      return NextResponse.json(
        { error: `Failed to fetch website: ${error.message}` },
        { status: 500 }
      )
    }

    // Parse HTML
    const root = parse(html)

    // Remove script, style, and nav elements
    root.querySelectorAll('script, style, nav, footer, header').forEach(el => el.remove())

    // Extract text content
    const scrapedData: ScrapedContent[] = []

    // 1. Get page title
    const titleEl = root.querySelector('title') || root.querySelector('h1')
    const title = titleEl?.textContent?.trim() || 'Homepage'

    // 2. Extract main content
    const mainEl = root.querySelector('main') || root.querySelector('article') || root.querySelector('body')
    const mainContent = mainEl?.textContent || ''
    const cleanContent = mainContent
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim()
      .substring(0, 5000) // Limit to 5000 chars

    if (cleanContent.length > 100) {
      scrapedData.push({
        title,
        content: cleanContent,
        category: 'general',
      })
    }

    // 3. Extract specific sections
    const sections = [
      { selector: '[class*="about"], [id*="about"]', category: 'about' },
      { selector: '[class*="product"], [id*="product"]', category: 'products' },
      { selector: '[class*="service"], [id*="service"]', category: 'services' },
      { selector: '[class*="value"], [id*="value"], [class*="mission"]', category: 'values' },
    ]

    sections.forEach(({ selector, category }) => {
      const elements = root.querySelectorAll(selector)
      const sectionContent = elements
        .map(el => el.textContent)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 3000)

      if (sectionContent.length > 100) {
        scrapedData.push({
          title: `${category.charAt(0).toUpperCase() + category.slice(1)} Section`,
          content: sectionContent,
          category,
        })
      }
    })

    // 4. Get meta description
    const metaDesc = root.querySelector('meta[name="description"]')
    const metaDescription = metaDesc?.getAttribute('content')
    if (metaDescription && metaDescription.length > 50) {
      scrapedData.push({
        title: 'Meta Description',
        content: metaDescription,
        category: 'about',
      })
    }

    // Save to database
    const savedData = []
    for (const data of scrapedData) {
      const saved = await prisma.brandTrainingData.create({
        data: {
          tenantId: session.user.tenantId,
          sourceUrl: url.toString(),
          content: data.content,
          category: data.category,
        },
      })
      savedData.push(saved)
    }

    // Update tenant with website URL if not set
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
    })

    if (!tenant?.website) {
      await prisma.tenant.update({
        where: { id: session.user.tenantId },
        data: {
          website: url.toString(),
        },
      })
    }

    // Analyze writing style
    const allContent = scrapedData.map(d => d.content).join(' ')
    const styleAnalysis = analyzeWritingStyle(allContent)

    return NextResponse.json({
      success: true,
      scraped: savedData.length,
      sections: scrapedData.map(d => ({
        category: d.category,
        preview: d.content.substring(0, 100) + '...',
      })),
      styleAnalysis,
      message: `Successfully scraped ${savedData.length} sections from ${url.hostname}`,
    })
  } catch (error: any) {
    console.error('Scraping error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to scrape website' },
      { status: 500 }
    )
  }
}

// GET /api/brand/scrape - Get existing brand training data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const brandData = await prisma.brandTrainingData.findMany({
      where: { tenantId: session.user.tenantId },
      orderBy: { lastUpdated: 'desc' },
    })

    // Group by category
    const grouped = brandData.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push({
        id: item.id,
        sourceUrl: item.sourceUrl,
        content: item.content,
        lastUpdated: item.lastUpdated,
      })
      return acc
    }, {} as Record<string, any[]>)

    return NextResponse.json({
      data: grouped,
      total: brandData.length,
    })
  } catch (error: any) {
    console.error('Get brand data error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch brand data' },
      { status: 500 }
    )
  }
}

// DELETE /api/brand/scrape - Clear all brand training data
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (session.user.role !== 'TENANT_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can delete brand training data' },
        { status: 403 }
      )
    }

    const result = await prisma.brandTrainingData.deleteMany({
      where: { tenantId: session.user.tenantId },
    })

    return NextResponse.json({
      success: true,
      deleted: result.count,
    })
  } catch (error: any) {
    console.error('Delete brand data error:', error)
    return NextResponse.json(
      { error: 'Failed to delete brand data' },
      { status: 500 }
    )
  }
}

// Helper: Analyze writing style
function analyzeWritingStyle(text: string) {
  const words = text.split(/\s+/).filter(w => w.length > 0)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  
  // Calculate averages
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length
  const avgSentenceLength = words.length / sentences.length
  
  // Detect tone
  const toneKeywords = {
    professional: ['ensure', 'deliver', 'quality', 'professional', 'expertise', 'solution'],
    casual: ['hey', 'awesome', 'cool', 'great', 'love', 'fun'],
    technical: ['implement', 'configure', 'optimize', 'integrate', 'architecture', 'system'],
    enthusiastic: ['amazing', 'excellent', 'incredible', 'outstanding', 'perfect', 'fantastic'],
  }
  
  const toneScores: Record<string, number> = {}
  Object.entries(toneKeywords).forEach(([tone, keywords]) => {
    const count = keywords.reduce((sum, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
      return sum + (text.match(regex) || []).length
    }, 0)
    toneScores[tone] = count
  })
  
  const dominantTone = Object.entries(toneScores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'professional'
  
  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    avgWordLength: Math.round(avgWordLength),
    avgSentenceLength: Math.round(avgSentenceLength),
    dominantTone,
    readabilityScore: avgSentenceLength < 20 ? 'easy' : avgSentenceLength < 30 ? 'moderate' : 'complex',
  }
}
