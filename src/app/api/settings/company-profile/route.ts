export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/settings/company-profile - Get company profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ SUPER_ADMIN should NOT access tenant settings directly
    if (session.user.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Super Admin should use Super Admin dashboard to manage tenants' },
        { status: 403 }
      )
    }

    // ✅ Ensure user has tenantId
    if (!session.user.tenantId) {
      return NextResponse.json(
        { error: 'User not associated with a tenant' },
        { status: 403 }
      )
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: {
        name: true,
        domain: true,
        website: true,
        industry: true,
        description: true,
      },
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Company profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(tenant)
  } catch (error: any) {
    console.error('Get company profile error:', error)
    return NextResponse.json(
      { error: 'Failed to get company profile' },
      { status: 500 }
    )
  }
}

// PATCH /api/settings/company-profile - Update company profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ SUPER_ADMIN should NOT access tenant settings directly
    if (session.user.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Super Admin should use Super Admin dashboard to manage tenants' },
        { status: 403 }
      )
    }

    // Check permissions - only admins can update
    if (session.user.role !== 'TENANT_ADMIN') {
      return NextResponse.json(
        { error: 'Only tenant admins can update company profile' },
        { status: 403 }
      )
    }

    // ✅ Ensure user has tenantId
    if (!session.user.tenantId) {
      return NextResponse.json(
        { error: 'User not associated with a tenant' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, domain, website, industry, description } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      )
    }

    const tenant = await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data: {
        name: name.trim(),
        ...(domain !== undefined && { domain: domain?.trim() || null }),
        ...(website !== undefined && { website: website?.trim() || null }),
        ...(industry !== undefined && { industry: industry?.trim() || null }),
        ...(description !== undefined && { description: description?.trim() || null }),
      },
    })

    return NextResponse.json({
      success: true,
      profile: {
        name: tenant.name,
        domain: tenant.domain,
        website: tenant.website,
        industry: tenant.industry,
        description: tenant.description,
      },
    })
  } catch (error: any) {
    console.error('Update company profile error:', error)
    return NextResponse.json(
      { error: 'Failed to update company profile' },
      { status: 500 }
    )
  }
}
