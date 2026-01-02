export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/content-sources - Get all content sources for tenant
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sources = await prisma.contentSource.findMany({
      where: { tenantId: session.user.tenantId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ sources })
  } catch (error: any) {
    console.error('Get content sources error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content sources' },
      { status: 500 }
    )
  }
}

// POST /api/content-sources - Create new content source
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - only editors and admins
    if (session.user.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Viewers cannot add content sources' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      type, // 'rss', 'website', 'competitor', 'news'
      url,
      isActive = true,
      settings = {},
    } = body

    if (!name || !type || !url) {
      return NextResponse.json(
        { error: 'Name, type, and URL are required' },
        { status: 400 }
      )
    }

    // Validate URL
    try {
      new URL(url)
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Validate type
    const validTypes = ['rss', 'website', 'competitor', 'news']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Create content source
    const source = await prisma.contentSource.create({
      data: {
        tenantId: session.user.tenantId,
        name,
        type,
        url,
        isActive,
        settings,
      },
    })

    return NextResponse.json({
      success: true,
      source,
      message: 'Content source added successfully',
    })
  } catch (error: any) {
    console.error('Create content source error:', error)
    return NextResponse.json(
      { error: 'Failed to create content source' },
      { status: 500 }
    )
  }
}

// PUT /api/content-sources - Update content source
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (session.user.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Viewers cannot update content sources' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      id,
      name,
      type,
      url,
      isActive,
      settings,
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Source ID is required' },
        { status: 400 }
      )
    }

    // Verify source belongs to tenant
    const existingSource = await prisma.contentSource.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existingSource) {
      return NextResponse.json(
        { error: 'Content source not found' },
        { status: 404 }
      )
    }

    // Update source
    const updatedSource = await prisma.contentSource.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(url !== undefined && { url }),
        ...(isActive !== undefined && { isActive }),
        ...(settings !== undefined && { settings }),
      },
    })

    return NextResponse.json({
      success: true,
      source: updatedSource,
      message: 'Content source updated successfully',
    })
  } catch (error: any) {
    console.error('Update content source error:', error)
    return NextResponse.json(
      { error: 'Failed to update content source' },
      { status: 500 }
    )
  }
}

// DELETE /api/content-sources - Delete content source
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (session.user.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Viewers cannot delete content sources' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Source ID is required' },
        { status: 400 }
      )
    }

    // Verify source belongs to tenant
    const source = await prisma.contentSource.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!source) {
      return NextResponse.json(
        { error: 'Content source not found' },
        { status: 404 }
      )
    }

    // Delete source
    await prisma.contentSource.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Content source deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete content source error:', error)
    return NextResponse.json(
      { error: 'Failed to delete content source' },
      { status: 500 }
    )
  }
}
