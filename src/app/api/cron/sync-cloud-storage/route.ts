export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  listFiles, 
  downloadFile, 
  refreshAccessToken,
  getFolderIdFromPath 
} from '@/lib/cloud-storage/google-drive'
import { uploadToCloudinary } from '@/lib/storage/cloudinary'

/**
 * CRON Job: Sync Cloud Storage
 * Runs every 15 minutes
 * Downloads new media from Google Drive/OneDrive and uploads to Cloudinary
 */
export async function GET(request: NextRequest) {
  try {
    // Verify CRON secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 CRON: Starting cloud storage sync...')

    // Find all active cloud storage integrations
    const integrations = await prisma.cloudStorageIntegration.findMany({
      where: { isActive: true },
      include: { tenant: true },
    })

    console.log(`📁 Found ${integrations.length} active integrations`)

    const results = {
      processed: 0,
      synced: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const integration of integrations) {
      try {
        console.log(`\n📂 Processing integration ${integration.id} for tenant ${integration.tenant.name}`)

        // Check if token needs refresh
        let accessToken = integration.accessToken
        if (integration.expiresAt && integration.expiresAt <= new Date()) {
          console.log('🔄 Access token expired, refreshing...')
          
          if (!integration.refreshToken) {
            throw new Error('No refresh token available')
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
            console.warn(`⚠️  Folder not found: ${integration.syncFolderPath}, syncing from root`)
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
          // Only get files modified in the last 24 hours
          modifiedAfter: new Date(Date.now() - 24 * 60 * 60 * 1000),
        })

        console.log(`📄 Found ${files.length} files in Drive`)

        // Process each file
        for (const file of files) {
          try {
            // Check if file already synced
            const existing = await prisma.syncedMedia.findUnique({
              where: {
                cloudStorageIntegrationId_originalFileId: {
                  cloudStorageIntegrationId: integration.id,
                  originalFileId: file.id,
                },
              },
            })

            if (existing) {
              console.log(`⏭️  Skipping already synced file: ${file.name}`)
              continue
            }

            console.log(`📥 Downloading: ${file.name} (${file.mimeType})`)

            // Download file from Drive
            const fileBuffer = await downloadFile(accessToken, file.id)

            // Determine media type
            const mediaType = file.mimeType?.startsWith('image/') ? 'image' : 'video'

            // Upload to Cloudinary
            console.log(`☁️  Uploading to Cloudinary...`)
            const cloudinaryResult = await uploadToCloudinary(
              fileBuffer,
              file.name || 'untitled',
              `synced/${integration.tenantId}`
            )

            console.log(`✅ Uploaded to Cloudinary: ${cloudinaryResult.secureUrl}`)

            // Create SyncedMedia entry
            await prisma.syncedMedia.create({
              data: {
                tenantId: integration.tenantId,
                cloudStorageIntegrationId: integration.id,
                originalFileName: file.name || 'untitled',
                originalFileId: file.id,
                originalFileUrl: file.webContentLink || '',
                originalFolderPath: integration.syncFolderPath,
                uploadedAt: file.createdTime ? new Date(file.createdTime) : new Date(),
                localUrl: cloudinaryResult.secureUrl,
                mediaType,
                fileSize: parseInt(file.size || '0'),
                mimeType: file.mimeType || 'unknown',
                processingStatus: 'PENDING',
                syncedAt: new Date(),
              },
            })

            console.log(`💾 Saved to database: ${file.name}`)
            results.synced++
          } catch (fileError: any) {
            console.error(`❌ Failed to process file ${file.name}:`, fileError.message)
            results.failed++
            results.errors.push(`${file.name}: ${fileError.message}`)
          }
        }

        // Update last synced time
        await prisma.cloudStorageIntegration.update({
          where: { id: integration.id },
          data: { lastSyncedAt: new Date() },
        })

        results.processed++
      } catch (integrationError: any) {
        console.error(`❌ Failed to process integration ${integration.id}:`, integrationError.message)
        results.failed++
        results.errors.push(`Integration ${integration.id}: ${integrationError.message}`)
      }
    }

    console.log('\n✨ CRON: Cloud storage sync complete')
    console.log(`📊 Results: ${results.synced} synced, ${results.failed} failed`)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (error: any) {
    console.error('❌ CRON: Cloud storage sync failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to sync cloud storage',
      },
      { status: 500 }
    )
  }
}

// Allow manual POST trigger
export async function POST(request: NextRequest) {
  return GET(request)
}
