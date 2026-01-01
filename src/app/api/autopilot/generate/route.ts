export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateContent } from '@/lib/ai/openai'

// POST /api/autopilot/generate - Bulk generate posts

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { count = 5, confidenceThreshold = 0.8, topics = [] } = body

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

    const created: string[] = []
    const failed: string[] = []

    // Generate posts based on topics or generic prompts
    const prompts = topics.length > 0
      ? topics.map((topic: string) => `Create a professional post about ${topic}`)
      : Array(count).fill('Create an engaging professional post for LinkedIn')

    for (let i = 0; i < Math.min(count, prompts.length); i++) {
      try {
        const result = await generateContent({
          prompt: prompts[i],
          brandVoice: aiConfig.brandVoice || undefined,
          tone: aiConfig.tonePreference as 'professional' | 'casual' | 'enthusiastic' | 'technical',
          includeHashtags: true,
          includeCTA: aiConfig.includeCTA
        })

        // Only create if confidence is above threshold
        if (result.confidence >= confidenceThreshold) {
          const post = await prisma.post.create({
            data: {
              tenantId: session.user.tenantId,
              userId: session.user.id,
              content: result.text,
              status: 'APPROVED', // Auto-approve high confidence
              aiGenerated: true,
              aiModel: aiConfig.selectedModel,
              aiConfidence: result.confidence,
              originalPrompt: prompts[i],
              generationTime: Date.now()
            }
          })

          created.push(post.id)
        } else {
          // Save as draft for review
          const post = await prisma.post.create({
            data: {
              tenantId: session.user.tenantId,
              userId: session.user.id,
              content: result.text,
              status: 'DRAFT',
              aiGenerated: true,
              aiModel: aiConfig.selectedModel,
              aiConfidence: result.confidence,
              originalPrompt: prompts[i],
              generationTime: Date.now()
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
