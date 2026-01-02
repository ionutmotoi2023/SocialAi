export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET LinkedIn integrations status (supports multiple profiles)

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const integrations = await prisma.linkedInIntegration.findMany({
      where: { tenantId: session.user.tenantId },
      select: {
        id: true,
        linkedinId: true,
        profileName: true,
        profileImage: true,
        profileType: true,
        organizationName: true,
        organizationId: true,
        isActive: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json({ integrations })
  } catch (error) {
    console.error('Get LinkedIn integration error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integration' },
      { status: 500 }
    )
  }
}

// DELETE LinkedIn integration (disconnect by ID)
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
        { error: 'Only admins can disconnect integrations' },
        { status: 403 }
      )
    }

    // Get integration ID from query params
    const { searchParams } = new URL(req.url)
    const integrationId = searchParams.get('id')

    if (!integrationId) {
      return NextResponse.json(
        { error: 'Integration ID required' },
        { status: 400 }
      )
    }

    const integration = await prisma.linkedInIntegration.findFirst({
      where: { 
        id: integrationId,
        tenantId: session.user.tenantId,
      },
    })

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      )
    }

    await prisma.linkedInIntegration.delete({
      where: { id: integration.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete LinkedIn integration error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect integration' },
      { status: 500 }
    )
  }
}
