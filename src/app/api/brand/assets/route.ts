export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/session-helpers'

// GET /api/brand/assets - List all brand assets for tenant

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getCurrentUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 404 })
    }

    const assets = await prisma.brandAsset.findMany({
      where: {
        tenantId: user.tenantId
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ assets })
  } catch (error) {
    console.error('Failed to fetch brand assets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    )
  }
}

// POST /api/brand/assets - Create new brand asset
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getCurrentUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 404 })
    }

    // Check permissions (only TENANT_ADMIN or SUPER_ADMIN can manage brand assets)
    if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, type, fileUrl, fileSize, mimeType, watermarkSettings } = body

    // Validation
    if (!name || !type || !fileUrl) {
      return NextResponse.json(
        { error: 'Name, type, and fileUrl are required' },
        { status: 400 }
      )
    }

    // If this is the first asset, make it default
    const existingAssets = await prisma.brandAsset.count({
      where: { tenantId: user.tenantId }
    })
    const isFirstAsset = existingAssets === 0

    // Create brand asset
    const asset = await prisma.brandAsset.create({
      data: {
        tenantId: user.tenantId,
        name,
        type,
        fileUrl,
        fileSize: fileSize || 0,
        mimeType: mimeType || 'image/png',
        isDefault: isFirstAsset,
        watermarkSettings: watermarkSettings || {
          enabled: true,
          position: 'bottom-right',
          opacity: 0.7,
          scale: 0.2
        }
      }
    })

    // If this is a logo type, update tenant logo
    if (type === 'logo' || type === 'LOGO') {
      await prisma.tenant.update({
        where: { id: session.user.tenantId },
        data: { logo: fileUrl },
      })
    }

    return NextResponse.json({ 
      asset,
      message: 'Brand asset created successfully' 
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create brand asset:', error)
    return NextResponse.json(
      { error: 'Failed to create asset' },
      { status: 500 }
    )
  }
}
