import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/super-admin/impersonate - Impersonate a tenant (SUPER_ADMIN only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only SUPER_ADMIN can impersonate
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ 
        error: 'Forbidden - Super Admin access required' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { tenantId } = body

    if (!tenantId) {
      return NextResponse.json({ 
        error: 'Tenant ID is required' 
      }, { status: 400 })
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        domain: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ 
        error: 'Tenant not found' 
      }, { status: 404 })
    }

    // Find a TENANT_ADMIN for this tenant to impersonate
    const tenantAdmin = await prisma.user.findFirst({
      where: {
        tenantId: tenantId,
        role: 'TENANT_ADMIN',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    // If no admin exists, find any user
    const targetUser = tenantAdmin || await prisma.user.findFirst({
      where: { tenantId: tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json({ 
        error: 'No users found for this tenant. Cannot impersonate.' 
      }, { status: 404 })
    }

    // Return impersonation data
    // Note: Actual session switching happens client-side via NextAuth
    // We just validate and return the data needed for the switch
    return NextResponse.json({ 
      success: true,
      impersonation: {
        originalUser: {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
        },
        targetUser: {
          id: targetUser.id,
          email: targetUser.email,
          name: targetUser.name,
          role: targetUser.role,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          domain: tenant.domain,
        },
      },
      message: `Ready to impersonate ${targetUser.email} at ${tenant.name}`,
    })
  } catch (error: any) {
    console.error('Error setting up impersonation:', error)
    return NextResponse.json(
      { error: 'Failed to setup impersonation', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/super-admin/impersonate - Exit impersonation
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return success - actual session restoration happens client-side
    return NextResponse.json({ 
      success: true,
      message: 'Impersonation ended. Returning to Super Admin view.',
    })
  } catch (error: any) {
    console.error('Error ending impersonation:', error)
    return NextResponse.json(
      { error: 'Failed to end impersonation', details: error.message },
      { status: 500 }
    )
  }
}
