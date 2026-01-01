export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT /api/brand/assets/[id]/default - Set asset as default

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (session.user.role !== 'TENANT_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const assetId = params.id

    // Verify asset belongs to tenant
    const asset = await prisma.brandAsset.findFirst({
      where: {
        id: assetId,
        tenantId: session.user.tenantId
      }
    })

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }

    // Use transaction to ensure consistency
    await prisma.$transaction([
      // Remove default from all other assets
      prisma.brandAsset.updateMany({
        where: {
          tenantId: session.user.tenantId,
          id: { not: assetId }
        },
        data: {
          isDefault: false
        }
      }),
      // Set this asset as default
      prisma.brandAsset.update({
        where: { id: assetId },
        data: {
          isDefault: true
        }
      })
    ])

    return NextResponse.json({ 
      message: 'Default asset updated successfully' 
    })
  } catch (error) {
    console.error('Failed to set default asset:', error)
    return NextResponse.json(
      { error: 'Failed to set default asset' },
      { status: 500 }
    )
  }
}
