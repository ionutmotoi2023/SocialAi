export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  ImageStyle, 
  ImageStylesConfig, 
  getDefaultImageStylesConfig,
  validateImageStyle 
} from '@/types/image-styles'

/**
 * GET /api/settings/image-styles - Get tenant's image styles configuration
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get AI config with image styles
    const aiConfig = await prisma.aIConfig.findUnique({
      where: { tenantId: session.user.tenantId },
      select: {
        imageStyles: true,
        defaultImageStyle: true,
      },
    })

    if (!aiConfig) {
      // Return default styles if no config exists
      const defaultConfig = getDefaultImageStylesConfig()
      return NextResponse.json({
        success: true,
        config: defaultConfig,
        isDefault: true,
      })
    }

    // Parse imageStyles JSON
    let stylesConfig: ImageStylesConfig
    if (aiConfig.imageStyles) {
      stylesConfig = aiConfig.imageStyles as ImageStylesConfig
    } else {
      stylesConfig = getDefaultImageStylesConfig()
    }

    return NextResponse.json({
      success: true,
      config: stylesConfig,
      defaultStyleId: aiConfig.defaultImageStyle,
      isDefault: false,
    })
  } catch (error: any) {
    console.error('Failed to fetch image styles:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch image styles' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/settings/image-styles - Update image styles configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { styles, defaultStyleId } = body as {
      styles: ImageStyle[]
      defaultStyleId: string
    }

    // Validate styles
    if (!Array.isArray(styles) || styles.length === 0) {
      return NextResponse.json(
        { error: 'Styles array is required and must not be empty' },
        { status: 400 }
      )
    }

    // Validate each style
    for (const style of styles) {
      const validationError = validateImageStyle(style)
      if (validationError) {
        return NextResponse.json(
          { error: `Invalid style "${style.name}": ${validationError}` },
          { status: 400 }
        )
      }
    }

    // Validate default style exists
    const defaultStyleExists = styles.some(s => s.id === defaultStyleId)
    if (!defaultStyleExists) {
      return NextResponse.json(
        { error: 'Default style ID must reference an existing style' },
        { status: 400 }
      )
    }

    // Build config object
    const stylesConfig: ImageStylesConfig = {
      styles,
      defaultStyleId,
    }

    // Update or create AI config
    const aiConfig = await prisma.aIConfig.upsert({
      where: { tenantId: session.user.tenantId },
      update: {
        imageStyles: stylesConfig,
        defaultImageStyle: defaultStyleId,
        updatedAt: new Date(),
      },
      create: {
        tenantId: session.user.tenantId,
        imageStyles: stylesConfig,
        defaultImageStyle: defaultStyleId,
      },
    })

    console.log(`✅ Image styles updated for tenant: ${session.user.tenantId}`)

    return NextResponse.json({
      success: true,
      config: stylesConfig,
      message: 'Image styles updated successfully',
    })
  } catch (error: any) {
    console.error('Failed to update image styles:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update image styles' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/settings/image-styles/reset - Reset to default styles
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const defaultConfig = getDefaultImageStylesConfig()

    // Update AI config with defaults
    await prisma.aIConfig.upsert({
      where: { tenantId: session.user.tenantId },
      update: {
        imageStyles: defaultConfig,
        defaultImageStyle: defaultConfig.defaultStyleId,
        updatedAt: new Date(),
      },
      create: {
        tenantId: session.user.tenantId,
        imageStyles: defaultConfig,
        defaultImageStyle: defaultConfig.defaultStyleId,
      },
    })

    console.log(`✅ Image styles reset to defaults for tenant: ${session.user.tenantId}`)

    return NextResponse.json({
      success: true,
      config: defaultConfig,
      message: 'Image styles reset to defaults',
    })
  } catch (error: any) {
    console.error('Failed to reset image styles:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to reset image styles' },
      { status: 500 }
    )
  }
}
