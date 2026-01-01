export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateContent } from '@/lib/ai/openai'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const {
      prompt,
      mediaUrls = [],
      includeHashtags = true,
      includeCTA = true,
      saveAsDraft = false,
    } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Get tenant's AI configuration
    const aiConfig = await prisma.aIConfig.findUnique({
      where: { tenantId: session.user.tenantId },
    })

    if (!aiConfig) {
      return NextResponse.json(
        { error: 'AI configuration not found. Please contact support.' },
        { status: 404 }
      )
    }

    // Generate content using OpenAI
    const generatedContent = await generateContent({
      prompt,
      mediaUrls,
      brandVoice: aiConfig.brandVoice || undefined,
      tone: aiConfig.tonePreference as any,
      postLength: aiConfig.postLength as any,
      includeHashtags: includeHashtags && aiConfig.includeEmojis,
      includeCTA: includeCTA && aiConfig.includeCTA,
      includeEmojis: aiConfig.includeEmojis,
      platform: 'linkedin',
    })

    // Optionally save as draft
    let savedPost = null
    if (saveAsDraft) {
      savedPost = await prisma.post.create({
        data: {
          tenantId: session.user.tenantId,
          userId: session.user.id,
          title: prompt.substring(0, 100),
          content: generatedContent.text,
          mediaUrls,
          status: 'DRAFT',
          platform: 'linkedin',
          aiGenerated: true,
          aiModel: generatedContent.model,
          aiConfidence: generatedContent.confidence,
          originalPrompt: prompt,
          generationTime: generatedContent.generationTime,
        },
      })
    }

    // Log AI learning data
    await prisma.aILearningData.create({
      data: {
        tenantId: session.user.tenantId,
        postId: savedPost?.id,
        interactionType: 'generation',
        originalContent: prompt,
        modifiedContent: generatedContent.text,
        improvementScore: generatedContent.confidence,
        patternDetected: `Generated with ${generatedContent.model}, confidence: ${generatedContent.confidence}`,
      },
    })

    return NextResponse.json({
      success: true,
      content: generatedContent,
      post: savedPost ? {
        id: savedPost.id,
        status: savedPost.status,
      } : null,
    })
  } catch (error: any) {
    console.error('Content generation error:', error)
    
    // Check if it's an OpenAI API error
    if (error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate content. Please try again.' },
      { status: 500 }
    )
  }
}
