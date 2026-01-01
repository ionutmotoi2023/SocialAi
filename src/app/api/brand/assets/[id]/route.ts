export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/brand/assets/[id] - Delete a brand asset

export async function DELETE(
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

    // Don't allow deleting the default asset if there are other assets
    if (asset.isDefault) {
      const otherAssets = await prisma.brandAsset.count({
        where: {
          tenantId: session.user.tenantId,
          id: { not: assetId }
        }
      })

      if (otherAssets > 0) {
        return NextResponse.json(
          { error: 'Cannot delete default asset. Set another asset as default first.' },
          { status: 400 }
        )
      }
    }

    // Delete the asset
    await prisma.brandAsset.delete({
      where: { id: assetId }
    })

    // TODO: Delete actual file from storage (local or S3)
    // await deleteFile(asset.fileUrl)

    return NextResponse.json({ 
      message: 'Asset deleted successfully' 
    })
  } catch (error) {
    console.error('Failed to delete brand asset:', error)
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    )
  }
}

// PUT /api/brand/assets/[id] - Update brand asset
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
    const body = await request.json()

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

    // Update the asset
    const updatedAsset = await prisma.brandAsset.update({
      where: { id: assetId },
      data: {
        name: body.name || asset.name,
        watermarkSettings: body.watermarkSettings || asset.watermarkSettings
      }
    })

    return NextResponse.json({ 
      asset: updatedAsset,
      message: 'Asset updated successfully' 
    })
  } catch (error) {
    console.error('Failed to update brand asset:', error)
    return NextResponse.json(
      { error: 'Failed to update asset' },
      { status: 500 }
    )
  }
}
