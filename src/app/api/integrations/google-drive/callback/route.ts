export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTokensFromCode, testConnection } from '@/lib/cloud-storage/google-drive'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/integrations/google-drive/callback
 * Handles OAuth callback from Google
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings/integrations?error=oauth_failed`
      )
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings/integrations?error=no_code`
      )
    }

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/login?error=unauthorized`
      )
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code)

    if (!tokens.access_token) {
      throw new Error('No access token received')
    }

    // Test connection
    const isValid = await testConnection(tokens.access_token)
    if (!isValid) {
      throw new Error('Failed to connect to Drive')
    }

    // Calculate expiration date
    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000) // 1 hour default

    // Save integration to database
    await prisma.cloudStorageIntegration.upsert({
      where: {
        tenantId_provider: {
          tenantId: session.user.tenantId,
          provider: 'GOOGLE_DRIVE',
        },
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        expiresAt,
        isActive: true,
        lastSyncedAt: new Date(),
      },
      create: {
        tenantId: session.user.tenantId,
        provider: 'GOOGLE_DRIVE',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        expiresAt,
        syncFolderPath: '/', // Default to root
        isActive: true,
        autoAnalyze: true,
        autoGenerate: false,
        autoApprove: false,
      },
    })

    console.log('✅ Google Drive connected successfully for tenant:', session.user.tenantId)

    // Redirect back to integrations page with success message
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/settings/integrations?success=drive_connected`
    )
  } catch (error: any) {
    console.error('Drive callback failed:', error)
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/settings/integrations?error=${encodeURIComponent(error.message)}`
    )
  }
}
