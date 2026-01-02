export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateContent } from '@/lib/ai/openai'
import { generateAndProcessImage } from '@/lib/image/dalle-workflow'

// POST /api/autopilot/generate - Bulk generate posts

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      count = 5, 
      confidenceThreshold = 0.8, 
      topics = [],
      generateImages = true, // NEW: Option to generate images
      imageStyle = 'professional' // NEW: Image style option
    } = body

    // Get AI config for tenant
    const aiConfig = await prisma.aIConfig.findUnique({
      where: { tenantId: session.user.tenantId }
    })

    if (!aiConfig) {
      return NextResponse.json(
        { error: 'AI configuration not found' },
        { status: 400 }
      )
    }

    // Get recent content inspiration from RSS feeds (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const rssInspiration = await prisma.aILearningData.findMany({
      where: {
        tenantId: session.user.tenantId,
        interactionType: 'content_inspiration',
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10, // Top 10 recent items for better selection
    })

    // Get brand training data
    const brandData = await prisma.brandTrainingData.findMany({
      where: { tenantId: session.user.tenantId },
      orderBy: { lastUpdated: 'desc' },
      take: 3,
    })

    // Get tenant info for enhanced context
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: {
        name: true,
        industry: true,
        description: true,
      },
    })

    // Build context for AI
    let contextPrompt = ''
    
    if (rssInspiration.length > 0) {
      contextPrompt += '\n\nRECENT INDUSTRY NEWS FOR INSPIRATION:\n'
      rssInspiration.forEach((item) => {
        contextPrompt += `- ${item.patternDetected}: ${item.originalContent?.substring(0, 150)}...\n`
      })
      contextPrompt += '\nUse these as inspiration for trending topics, but create original content.\n'
    }

    if (brandData.length > 0) {
      contextPrompt += '\n\nBRAND CONTEXT:\n'
      brandData.forEach((data) => {
        contextPrompt += `[${data.category}]: ${data.content.substring(0, 200)}...\n`
      })
    }

    const created: string[] = []
    const failed: string[] = []

    // Generate posts based on topics or generic prompts
    const prompts = topics.length > 0
      ? topics.map((topic: string) => `Create a professional post about ${topic}${contextPrompt}`)
      : Array(count).fill(`Create an engaging professional post for LinkedIn${contextPrompt}`)

    for (let i = 0; i < Math.min(count, prompts.length); i++) {
      try {
        // Select RSS inspiration for this post (round-robin)
        const inspirationItem = rssInspiration.length > 0 
          ? rssInspiration[i % rssInspiration.length]
          : null

        // Build brand variables from aiConfig
        const brandVariables = {
          companyName: aiConfig.companyName || tenant?.name,
          companyTagline: aiConfig.companyTagline || undefined,
          targetAudience: aiConfig.targetAudience || undefined,
          keyProducts: aiConfig.keyProducts || undefined,
          uniqueValue: aiConfig.uniqueValue || undefined,
          foundedYear: aiConfig.foundedYear || undefined,
          teamSize: aiConfig.teamSize || undefined,
          headquarters: aiConfig.headquarters || undefined,
        }

        const startTime = Date.now() // Start timer
        const result = await generateContent({
          prompt: prompts[i],
          brandVoice: aiConfig.brandVoice || undefined,
          brandVariables, // NEW: Pass brand variables
          tone: aiConfig.tonePreference as 'professional' | 'casual' | 'enthusiastic' | 'technical',
          includeHashtags: true,
          includeCTA: aiConfig.includeCTA
        })
        const generationTimeSeconds = Math.round((Date.now() - startTime) / 1000) // Convert to seconds

        // NEW: Generate image with DALL-E 3 if enabled
        let mediaUrls: string[] = []
        if (generateImages) {
          try {
            console.log(`Generating image for post ${i + 1} with enhanced context...`)
            
            // Build brand context string from brand data
            const brandContextString = brandData.length > 0
              ? brandData.map(d => `[${d.category}]: ${d.content.substring(0, 300)}`).join('\n')
              : undefined

            // Build RSS inspiration object
            const rssInspirationData = inspirationItem ? {
              title: inspirationItem.patternDetected || '',
              content: inspirationItem.originalContent?.substring(0, 200) || ''
            } : undefined

            // Build tenant info object
            const tenantInfoData = tenant ? {
              name: tenant.name,
              industry: tenant.industry || undefined,
              description: tenant.description || undefined
            } : undefined

            const imageResult = await generateAndProcessImage(
              result.text,
              session.user.tenantId,
              {
                platform: 'linkedin',
                style: imageStyle as 'professional' | 'creative' | 'minimalist' | 'bold',
                // ✅ Pass full context for relevant image generation
                brandContext: brandContextString,
                rssInspiration: rssInspirationData,
                tenantInfo: tenantInfoData
              }
            )
            mediaUrls = [imageResult.imageUrl]
            console.log(`✅ Image generated with context and watermarked: ${imageResult.imageUrl}`)
          } catch (imageError) {
            console.error(`Failed to generate image for post ${i + 1}:`, imageError)
            // Continue without image if generation fails
          }
        }

        // Only create if confidence is above threshold
        if (result.confidence >= confidenceThreshold) {
          const post = await prisma.post.create({
            data: {
              tenantId: session.user.tenantId,
              userId: session.user.id,
              title: result.title, // ✅ NEW: Use AI-generated title
              content: result.text,
              mediaUrls, // NEW: Include generated images
              status: 'DRAFT', // Changed from APPROVED - user should review before publishing
              aiGenerated: true,
              aiModel: aiConfig.selectedModel,
              aiConfidence: result.confidence,
              originalPrompt: prompts[i],
              generationTime: generationTimeSeconds, // Save in seconds, not milliseconds
              // NEW: RSS Source tracking
              contentSourceId: inspirationItem?.contentSourceId || null,
              rssItemTitle: inspirationItem?.patternDetected || null,
              rssItemUrl: inspirationItem?.rssItemUrl || null,
              rssItemDate: inspirationItem?.createdAt || null,
            }
          })

          created.push(post.id)
        } else {
          // Save as draft for review
          const post = await prisma.post.create({
            data: {
              tenantId: session.user.tenantId,
              userId: session.user.id,
              title: result.title, // ✅ NEW: Use AI-generated title
              content: result.text,
              mediaUrls, // NEW: Include generated images
              status: 'DRAFT',
              aiGenerated: true,
              aiModel: aiConfig.selectedModel,
              aiConfidence: result.confidence,
              originalPrompt: prompts[i],
              generationTime: generationTimeSeconds, // Save in seconds, not milliseconds
              // NEW: RSS Source tracking
              contentSourceId: inspirationItem?.contentSourceId || null,
              rssItemTitle: inspirationItem?.patternDetected || null,
              rssItemUrl: inspirationItem?.rssItemUrl || null,
              rssItemDate: inspirationItem?.createdAt || null,
            }
          })

          created.push(post.id)
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Failed to generate post ${i + 1}:`, error)
        failed.push(`Post ${i + 1}`)
      }
    }

    return NextResponse.json({
      created: created.length,
      failed: failed.length,
      postIds: created,
      message: `Successfully generated ${created.length} posts`
    })
  } catch (error) {
    console.error('Bulk generation failed:', error)
    return NextResponse.json(
      { error: 'Failed to generate posts' },
      { status: 500 }
    )
  }
}
