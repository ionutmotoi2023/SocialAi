// Set DATABASE_URL from command line or use the one you provided
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:HZlxTekzjERdCfxJSObKSiIOovpcfgSW@shortline.proxy.rlwy.net:38171/railway'

import { prisma } from '../src/lib/prisma'

async function checkSyncedMedia() {
  console.log('🔍 Checking synced media in database...\n')

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: 'ionut.motoi@siteq.ro' },
      include: { tenant: true },
    })

    if (!user) {
      console.error('❌ User not found')
      return
    }

    console.log('✅ User found:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Tenant ID: ${user.tenantId}`)
    console.log(`   Tenant Name: ${user.tenant?.name}\n`)

    // Get synced media for this tenant
    const media = await prisma.syncedMedia.findMany({
      where: {
        tenantId: user.tenantId!,
      },
      orderBy: {
        syncedAt: 'desc',
      },
      take: 20,
    })

    console.log(`📊 Found ${media.length} synced media items:\n`)

    if (media.length === 0) {
      console.log('⚠️  No media found! This explains why the UI is empty.\n')
      
      // Check if there's media for other tenants
      const allMedia = await prisma.syncedMedia.count()
      console.log(`ℹ️  Total media in database (all tenants): ${allMedia}`)
      
      if (allMedia > 0) {
        const mediaTenants = await prisma.syncedMedia.findMany({
          select: { tenantId: true },
          distinct: ['tenantId'],
        })
        console.log(`ℹ️  Media exists for tenants: ${mediaTenants.map(m => m.tenantId).join(', ')}`)
      }
    } else {
      media.forEach((item, index) => {
        console.log(`${index + 1}. ${item.originalFileName}`)
        console.log(`   ID: ${item.id}`)
        console.log(`   Tenant ID: ${item.tenantId}`)
        console.log(`   Local URL: ${item.localUrl || 'N/A'}`)
        console.log(`   Original URL: ${item.originalFileUrl}`)
        console.log(`   Media Type: ${item.mediaType}`)
        console.log(`   Status: ${item.processingStatus}`)
        console.log(`   Synced At: ${item.syncedAt}\n`)
      })
    }

    // Check Google Drive integration
    const integration = await prisma.cloudStorageIntegration.findFirst({
      where: {
        tenantId: user.tenantId!,
        provider: 'GOOGLE_DRIVE',
      },
    })

    if (integration) {
      console.log('✅ Google Drive integration found:')
      console.log(`   ID: ${integration.id}`)
      console.log(`   Active: ${integration.isActive}`)
      console.log(`   Sync Folder: ${integration.syncFolderPath}`)
      console.log(`   Last Synced: ${integration.lastSyncedAt || 'Never'}`)
    } else {
      console.log('❌ No Google Drive integration found')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSyncedMedia()
