import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/super-admin/tenants/[id] - Get single tenant details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only SUPER_ADMIN can access this endpoint
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ 
        error: 'Forbidden - Super Admin access required' 
      }, { status: 403 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            users: true,
            posts: true,
            contentSources: true,
            brandAssets: true,
            aiLearningData: true,
            brandTrainingData: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        aiConfigs: true,
        autoPilotConfigs: true,
        posts: {
          select: {
            id: true,
            title: true,
            status: true,
            platform: true,
            createdAt: true,
            publishedAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        contentSources: {
          select: {
            id: true,
            name: true,
            type: true,
            url: true,
            isActive: true,
          },
        },
        brandAssets: {
          select: {
            id: true,
            name: true,
            type: true,
            url: true,
            isDefault: true,
          },
        },
      },
    })

    if (!tenant) {
      return NextResponse.json({ 
        error: 'Tenant not found' 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      tenant,
    })
  } catch (error: any) {
    console.error('Error fetching tenant:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenant', details: error.message },
      { status: 500 }
    )
  }
}

// PUT /api/super-admin/tenants/[id] - Update tenant
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only SUPER_ADMIN can access this endpoint
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ 
        error: 'Forbidden - Super Admin access required' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { name, domain, website, industry, description, logo } = body

    const tenant = await prisma.tenant.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(domain !== undefined && { domain }),
        ...(website !== undefined && { website }),
        ...(industry !== undefined && { industry }),
        ...(description !== undefined && { description }),
        ...(logo !== undefined && { logo }),
      },
    })

    return NextResponse.json({ 
      success: true,
      tenant,
      message: 'Tenant updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating tenant:', error)
    return NextResponse.json(
      { error: 'Failed to update tenant', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/super-admin/tenants/[id] - Delete tenant (dangerous!)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only SUPER_ADMIN can access this endpoint
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ 
        error: 'Forbidden - Super Admin access required' 
      }, { status: 403 })
    }

    // Delete tenant (cascading will delete all related data)
    await prisma.tenant.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ 
      success: true,
      message: 'Tenant deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting tenant:', error)
    return NextResponse.json(
      { error: 'Failed to delete tenant', details: error.message },
      { status: 500 }
    )
  }
}
