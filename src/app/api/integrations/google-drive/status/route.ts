export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/integrations/google-drive/status
 * Check if Google Drive is connected
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get integration status
    const integration = await prisma.cloudStorageIntegration.findUnique({
      where: {
        tenantId_provider: {
          tenantId: session.user.tenantId,
          provider: 'GOOGLE_DRIVE',
        },
      },
      select: {
        id: true,
        isActive: true,
        syncFolderPath: true,
        lastSyncedAt: true,
        autoAnalyze: true,
        autoGenerate: true,
        autoApprove: true,
        createdAt: true,
      },
    })

    if (!integration) {
      return NextResponse.json({
        connected: false,
        integration: null,
      })
    }

    return NextResponse.json({
      connected: true,
      integration: {
        id: integration.id,
        isActive: integration.isActive,
        syncFolderPath: integration.syncFolderPath,
        lastSyncedAt: integration.lastSyncedAt,
        autoAnalyze: integration.autoAnalyze,
        autoGenerate: integration.autoGenerate,
        autoApprove: integration.autoApprove,
        connectedAt: integration.createdAt,
      },
    })
  } catch (error: any) {
    console.error('Drive status check failed:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check Drive status' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/integrations/google-drive/status
 * Update Drive integration settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (session.user.role !== 'TENANT_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can update Drive settings' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { syncFolderPath, autoAnalyze, autoGenerate, autoApprove, isActive } = body

    // Update integration
    const integration = await prisma.cloudStorageIntegration.update({
      where: {
        tenantId_provider: {
          tenantId: session.user.tenantId,
          provider: 'GOOGLE_DRIVE',
        },
      },
      data: {
        ...(syncFolderPath !== undefined && { syncFolderPath }),
        ...(autoAnalyze !== undefined && { autoAnalyze }),
        ...(autoGenerate !== undefined && { autoGenerate }),
        ...(autoApprove !== undefined && { autoApprove }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json({
      success: true,
      integration: {
        id: integration.id,
        isActive: integration.isActive,
        syncFolderPath: integration.syncFolderPath,
        autoAnalyze: integration.autoAnalyze,
        autoGenerate: integration.autoGenerate,
        autoApprove: integration.autoApprove,
      },
    })
  } catch (error: any) {
    console.error('Drive settings update failed:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update Drive settings' },
      { status: 500 }
    )
  }
}
