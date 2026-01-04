export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  listFiles, 
  downloadFile, 
  refreshAccessToken,
  getFolderIdFromPath 
} from '@/lib/cloud-storage/google-drive'
import { uploadToCloudinary } from '@/lib/storage/cloudinary'

/**
 * POST /api/integrations/google-drive/sync-now
 * Trigger manual sync immediately
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Manual sync triggered by user:', session.user.email)

    // Get Drive integration
    const integration = await prisma.cloudStorageIntegration.findUnique({
      where: {
        tenantId_provider: {
          tenantId: session.user.tenantId,
          provider: 'GOOGLE_DRIVE',
        },
      },
      include: { tenant: true },
    })

    if (!integration) {
      return NextResponse.json(
        { error: 'Google Drive not connected' },
        { status: 404 }
      )
    }

    if (!integration.isActive) {
      return NextResponse.json(
        { error: 'Google Drive integration is disabled' },
        { status: 400 }
      )
    }

    // Check if token needs refresh
    let accessToken = integration.accessToken
    if (integration.expiresAt && integration.expiresAt <= new Date()) {
      console.log('🔄 Access token expired, refreshing...')
      
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

      console.log('✅ Token refreshed successfully')
    }

    // Get folder ID from path
    let folderId: string | null = null
    if (integration.syncFolderPath !== '/') {
      folderId = await getFolderIdFromPath(accessToken, integration.syncFolderPath)
      if (!folderId) {
        return NextResponse.json(
          { error: `Folder not found: ${integration.syncFolderPath}` },
          { status: 404 }
        )
      }
    }

    // List files from Drive
    const { files } = await listFiles(accessToken, {
      folderId: folderId || undefined,
      mimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/quicktime',
        'video/x-msvideo',
      ],
      pageSize: 50,
      // Only get files modified in the last 7 days (for manual sync)
      modifiedAfter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    })

    console.log(`📄 Found ${files.length} files in Drive folder: ${integration.syncFolderPath}`)

    let synced = 0
    let skipped = 0
    const errors: string[] = []

    for (const file of files) {
      try {
        // Check if file already synced
        const existing = await prisma.syncedMedia.findFirst({
          where: {
            tenantId: integration.tenantId,
            originalFileName: file.name!,
            originalFileId: file.id!,
          },
        })

        if (existing) {
          console.log(`⏭️  Skipped (already exists): ${file.name} [ID: ${existing.id}]`)
          skipped++
          continue
        }

        console.log(`📥 Downloading: ${file.name}`)

        // Download file from Drive
        const fileBuffer = await downloadFile(accessToken, file.id!)

        // Upload to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(
          fileBuffer,
          file.name!,
          file.mimeType!.startsWith('video/') ? 'video' : 'image'
        )

        console.log(`📤 Uploaded to Cloudinary: ${cloudinaryResult.secureUrl}`)

        // Save to database
        await prisma.syncedMedia.create({
          data: {
            tenantId: integration.tenantId,
            cloudStorageIntegrationId: integration.id,
            originalFileId: file.id!,
            originalFileName: file.name!,
            originalFileUrl: file.webContentLink || '',
            originalFolderPath: integration.syncFolderPath,
            localUrl: cloudinaryResult.secureUrl, // Use only the secure URL string
            mediaType: file.mimeType!.startsWith('video/') ? 'video' : 'image',
            mimeType: file.mimeType!,
            fileSize: file.size ? parseInt(file.size) : 0,
            processingStatus: 'PENDING',
            uploadedAt: file.createdTime ? new Date(file.createdTime) : undefined,
          },
        })

        synced++
        console.log(`✅ Synced: ${file.name}`)
      } catch (error: any) {
        console.error(`❌ Failed to sync ${file.name}:`, error)
        errors.push(`${file.name}: ${error.message}`)
      }
    }

    // Update last synced timestamp
    await prisma.cloudStorageIntegration.update({
      where: { id: integration.id },
      data: { lastSyncedAt: new Date() },
    })

    console.log(`✨ Manual sync complete: ${synced} synced, ${skipped} skipped`)

    return NextResponse.json({
      success: true,
      synced,
      skipped,
      total: files.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully synced ${synced} new file(s)`,
    })
  } catch (error: any) {
    console.error('Manual sync failed:', error)
    return NextResponse.json(
      { error: error.message || 'Sync failed' },
      { status: 500 }
    )
  }
}
