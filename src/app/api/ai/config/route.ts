export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/ai/config - Get AI configuration including brand variables
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ Check if user has tenantId
    if (!session.user.tenantId) {
      return NextResponse.json(
        { error: 'User not associated with a tenant' },
        { status: 403 }
      )
    }

    const aiConfig = await prisma.aIConfig.findUnique({
      where: { tenantId: session.user.tenantId },
    })

    if (!aiConfig) {
      return NextResponse.json(
        { error: 'AI configuration not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(aiConfig)
  } catch (error: any) {
    console.error('Get AI config error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI configuration' },
      { status: 500 }
    )
  }
}

// PATCH /api/ai/config - Update brand variables
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ Check if user has tenantId
    if (!session.user.tenantId) {
      return NextResponse.json(
        { error: 'User not associated with a tenant' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      companyName,
      companyTagline,
      targetAudience,
      keyProducts,
      uniqueValue,
      foundedYear,
      teamSize,
      headquarters,
      // Also support updating other AI config fields
      brandVoice,
      tonePreference,
      postLength,
      includeEmojis,
      includeCTA,
    } = body

    // Update or create AI config
    const aiConfig = await prisma.aIConfig.upsert({
      where: { tenantId: session.user.tenantId },
      update: {
        // Brand variables
        ...(companyName !== undefined && { companyName }),
        ...(companyTagline !== undefined && { companyTagline }),
        ...(targetAudience !== undefined && { targetAudience }),
        ...(keyProducts !== undefined && { keyProducts }),
        ...(uniqueValue !== undefined && { uniqueValue }),
        ...(foundedYear !== undefined && { foundedYear }),
        ...(teamSize !== undefined && { teamSize }),
        ...(headquarters !== undefined && { headquarters }),
        // Other AI config fields
        ...(brandVoice !== undefined && { brandVoice }),
        ...(tonePreference !== undefined && { tonePreference }),
        ...(postLength !== undefined && { postLength }),
        ...(includeEmojis !== undefined && { includeEmojis }),
        ...(includeCTA !== undefined && { includeCTA }),
      },
      create: {
        tenantId: session.user.tenantId,
        companyName,
        companyTagline,
        targetAudience,
        keyProducts,
        uniqueValue,
        foundedYear,
        teamSize,
        headquarters,
        brandVoice,
        tonePreference: tonePreference || 'professional',
        postLength: postLength || 'medium',
        includeEmojis: includeEmojis !== undefined ? includeEmojis : true,
        includeCTA: includeCTA !== undefined ? includeCTA : true,
      },
    })

    return NextResponse.json({
      success: true,
      config: aiConfig,
    })
  } catch (error: any) {
    console.error('Update AI config error:', error)
    return NextResponse.json(
      { error: 'Failed to update AI configuration' },
      { status: 500 }
    )
  }
}
