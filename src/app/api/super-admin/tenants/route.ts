import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/super-admin/tenants - List all tenants (SUPER_ADMIN only)
export async function GET(request: NextRequest) {
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

    // Get all tenants with stats
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            posts: true,
            contentSources: true,
            brandAssets: true,
          },
        },
        users: {
          where: {
            role: 'TENANT_ADMIN',
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        aiConfigs: {
          select: {
            selectedModel: true,
            brandVoice: true,
            companyName: true,
          },
        },
        autoPilotConfigs: {
          select: {
            enabled: true,
            postsPerWeek: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ 
      success: true,
      tenants: tenants.map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        domain: tenant.domain,
        website: tenant.website,
        industry: tenant.industry,
        description: tenant.description,
        logo: tenant.logo,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
        stats: {
          users: tenant._count.users,
          posts: tenant._count.posts,
          contentSources: tenant._count.contentSources,
          brandAssets: tenant._count.brandAssets,
        },
        admins: tenant.users,
        aiConfig: tenant.aiConfigs[0] || null,
        autoPilotConfig: tenant.autoPilotConfigs[0] || null,
      })),
    })
  } catch (error: any) {
    console.error('Error fetching tenants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenants', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/super-admin/tenants - Create new tenant (SUPER_ADMIN only)
export async function POST(request: NextRequest) {
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
    const { name, domain, website, industry, description } = body

    if (!name) {
      return NextResponse.json({ 
        error: 'Tenant name is required' 
      }, { status: 400 })
    }

    // Create new tenant
    const tenant = await prisma.tenant.create({
      data: {
        name,
        domain,
        website,
        industry,
        description,
      },
    })

    // Create default AI config for the new tenant
    await prisma.aIConfig.create({
      data: {
        tenantId: tenant.id,
      },
    })

    // Create default Auto-Pilot config for the new tenant
    await prisma.autoPilotConfig.create({
      data: {
        tenantId: tenant.id,
      },
    })

    return NextResponse.json({ 
      success: true,
      tenant,
      message: 'Tenant created successfully',
    })
  } catch (error: any) {
    console.error('Error creating tenant:', error)
    return NextResponse.json(
      { error: 'Failed to create tenant', details: error.message },
      { status: 500 }
    )
  }
}
