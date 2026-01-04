export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { listFolders, refreshAccessToken } from '@/lib/cloud-storage/google-drive'

/**
 * GET /api/integrations/google-drive/folders?parentId=root
 * List folders in Google Drive for folder picker
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const parentId = searchParams.get('parentId') || 'root'

    // Get Drive integration
    const integration = await prisma.cloudStorageIntegration.findUnique({
      where: {
        tenantId_provider: {
          tenantId: session.user.tenantId,
          provider: 'GOOGLE_DRIVE',
        },
      },
    })

    if (!integration) {
      return NextResponse.json(
        { error: 'Google Drive not connected' },
        { status: 404 }
      )
    }

    // Check if token needs refresh
    let accessToken = integration.accessToken
    if (integration.expiresAt && integration.expiresAt <= new Date()) {
      if (!integration.refreshToken) {
        return NextResponse.json(
          { error: 'Token expired and no refresh token available' },
          { status: 401 }
        )
      }

      const newTokens = await refreshAccessToken(integration.refreshToken)
      accessToken = newTokens.access_token!

      // Update tokens in database
      await prisma.cloudStorageIntegration.update({
        where: { id: integration.id },
        data: {
          accessToken,
          refreshToken: newTokens.refresh_token || integration.refreshToken,
          expiresAt: newTokens.expiry_date ? new Date(newTokens.expiry_date) : undefined,
        },
      })
    }

    // List folders
    const folders = await listFolders(accessToken, parentId)

    return NextResponse.json({
      success: true,
      folders,
      parentId,
    })
  } catch (error: any) {
    console.error('Failed to list Drive folders:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to list folders' },
      { status: 500 }
    )
  }
}
