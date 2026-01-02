export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateAndProcessImage, generateCustomImage, processExistingImage } from '@/lib/image/dalle-workflow'
import { prisma } from '@/lib/prisma'

// POST /api/ai/generate-image - Generate image with DALL-E 3
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      mode = 'post-based', // 'post-based', 'custom', 'process-existing'
      postContent,
      customPrompt,
      existingImageUrl,
      platform = 'linkedin',
      style = 'professional',
      size = '1024x1024',
      quality = 'standard',
    } = body

    let result

    switch (mode) {
      case 'post-based':
        // Generate image based on post content
        if (!postContent) {
          return NextResponse.json(
            { error: 'postContent is required for post-based mode' },
            { status: 400 }
          )
        }

        // Fetch brand and tenant context for better image generation
        const brandData = await prisma.brandTrainingData.findMany({
          where: { tenantId: session.user.tenantId },
          orderBy: { lastUpdated: 'desc' },
          take: 3,
        })

        const tenant = await prisma.tenant.findUnique({
          where: { id: session.user.tenantId },
          select: {
            name: true,
            industry: true,
            description: true,
          },
        })

        // Build context for image generation
        const brandContextString = brandData.length > 0
          ? brandData.map(d => `[${d.category}]: ${d.content.substring(0, 300)}`).join('\n')
          : undefined

        const tenantInfoData = tenant ? {
          name: tenant.name,
          industry: tenant.industry || undefined,
          description: tenant.description || undefined
        } : undefined

        result = await generateAndProcessImage(postContent, session.user.tenantId, {
          platform,
          style,
          brandContext: brandContextString,
          tenantInfo: tenantInfoData,
        })
        break

      case 'custom':
        // Generate image with custom prompt
        if (!customPrompt) {
          return NextResponse.json(
            { error: 'customPrompt is required for custom mode' },
            { status: 400 }
          )
        }

        result = await generateCustomImage(customPrompt, session.user.tenantId, {
          size,
          quality,
        })
        break

      case 'process-existing':
        // Apply watermark to existing image
        if (!existingImageUrl) {
          return NextResponse.json(
            { error: 'existingImageUrl is required for process-existing mode' },
            { status: 400 }
          )
        }

        result = await processExistingImage(existingImageUrl, session.user.tenantId)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid mode. Use: post-based, custom, or process-existing' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      image: result,
      message: 'Image generated and watermarked successfully',
    })
  } catch (error: any) {
    console.error('Image generation API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate image', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}
