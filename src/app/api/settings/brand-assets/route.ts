export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/settings/brand-assets - Get all brand assets for tenant
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const assets = await prisma.brandAsset.findMany({
      where: { tenantId: session.user.tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        fileUrl: true,
        fileSize: true,
        mimeType: true,
        isDefault: true,
        watermarkSettings: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ assets })
  } catch (error) {
    console.error('Get brand assets error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch brand assets' },
      { status: 500 }
    )
  }
}

// POST /api/settings/brand-assets - Create new brand asset
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has admin role
    if (session.user.role !== 'TENANT_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can create brand assets' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { name, type, fileUrl, fileSize, mimeType, isDefault, watermarkSettings } = body

    if (!name || !type || !fileUrl) {
      return NextResponse.json(
        { error: 'Name, type, and fileUrl are required' },
        { status: 400 }
      )
    }

    const asset = await prisma.brandAsset.create({
      data: {
        tenantId: session.user.tenantId,
        name,
        type,
        fileUrl,
        fileSize,
        mimeType,
        isDefault: isDefault || false,
        watermarkSettings,
      },
    })

    // If this is a logo type, update tenant logo
    if (type === 'logo' || type === 'LOGO') {
      await prisma.tenant.update({
        where: { id: session.user.tenantId },
        data: { logo: fileUrl },
      })
    }

    return NextResponse.json({ asset })
  } catch (error) {
    console.error('Create brand asset error:', error)
    return NextResponse.json(
      { error: 'Failed to create brand asset' },
      { status: 500 }
    )
  }
}

// DELETE /api/settings/brand-assets - Delete brand asset
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has admin role
    if (session.user.role !== 'TENANT_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can delete brand assets' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const assetId = searchParams.get('id')

    if (!assetId) {
      return NextResponse.json(
        { error: 'Asset ID required' },
        { status: 400 }
      )
    }

    const asset = await prisma.brandAsset.findFirst({
      where: { 
        id: assetId,
        tenantId: session.user.tenantId,
      },
    })

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }

    await prisma.brandAsset.delete({
      where: { id: assetId },
    })

    // If this was a LOGO, clear tenant logo
    if (asset.type === 'LOGO') {
      await prisma.tenant.update({
        where: { id: session.user.tenantId },
        data: { logo: null },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete brand asset error:', error)
    return NextResponse.json(
      { error: 'Failed to delete brand asset' },
      { status: 500 }
    )
  }
}
