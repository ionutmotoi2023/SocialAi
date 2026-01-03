export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET AI configuration

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // ✅ SUPER_ADMIN should NOT access tenant settings directly
    if (session.user.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Super Admin should use Super Admin dashboard to manage tenants' },
        { status: 403 }
      )
    }

    // ✅ Check if user has tenantId (required for non-SUPER_ADMIN)
    if (!session.user.tenantId) {
      return NextResponse.json(
        { error: 'User not associated with a tenant' },
        { status: 403 }
      )
    }

    const config = await prisma.aIConfig.findUnique({
      where: { tenantId: session.user.tenantId },
    })

    if (!config) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Get AI config error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    )
  }
}

// PUT update AI configuration
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // ✅ SUPER_ADMIN should NOT access tenant settings directly
    if (session.user.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Super Admin should use Super Admin dashboard to manage tenants' },
        { status: 403 }
      )
    }

    // ✅ Check if user has tenantId
    if (!session.user.tenantId) {
      return NextResponse.json(
        { error: 'User not associated with a tenant' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const {
      selectedModel,
      brandVoice,
      tonePreference,
      postLength,
      hashtagStrategy,
      includeEmojis,
      includeCTA,
      additionalInstructions,
    } = body

    const config = await prisma.aIConfig.upsert({
      where: { tenantId: session.user.tenantId },
      update: {
        selectedModel,
        brandVoice,
        tonePreference,
        postLength,
        hashtagStrategy,
        includeEmojis,
        includeCTA,
        additionalInstructions,
      },
      create: {
        tenantId: session.user.tenantId,
        selectedModel: selectedModel || 'gpt-4-turbo',
        brandVoice,
        tonePreference: tonePreference || 'professional',
        postLength: postLength || 'medium',
        hashtagStrategy: hashtagStrategy || 'moderate',
        includeEmojis: includeEmojis ?? true,
        includeCTA: includeCTA ?? true,
        additionalInstructions,
      },
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('Update AI config error:', error)
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    )
  }
}
