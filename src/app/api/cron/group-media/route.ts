export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  groupBySameDay,
  groupBySequentialUpload,
  groupBySimilarTopics,
  detectEvents,
  mergeRelatedGroups,
} from '@/lib/grouping/algorithms'

/**
 * CRON Job: Group Media
 * Runs every 20 minutes
 * Applies smart grouping rules to analyzed media
 */
export async function GET(request: NextRequest) {
  try {
    // Verify CRON secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🎯 CRON: Starting media grouping...')

    // Find tenants with Drive sync enabled and grouping enabled
    const tenants = await prisma.tenant.findMany({
      where: {
        autoPilotConfigs: {
          some: {
            enableDriveSync: true,
            groupingEnabled: true,
          },
        },
      },
      include: {
        autoPilotConfigs: true,
      },
    })

    console.log(`👥 Found ${tenants.length} tenants with grouping enabled`)

    const results = {
      processed: 0,
      grouped: 0,
      mediaProcessed: 0,
      groupsCreated: 0,
      errors: [] as string[],
    }

    for (const tenant of tenants) {
      try {
        const config = tenant.autoPilotConfigs[0]
        console.log(`\n👤 Processing tenant: ${tenant.name}`)

        // Find analyzed but ungrouped media
        const ungroupedMedia = await prisma.syncedMedia.findMany({
          where: {
            tenantId: tenant.id,
            processingStatus: 'ANALYZED',
            isGrouped: false,
            postGenerated: false,
          },
          orderBy: { uploadedAt: 'asc' },
        })

        console.log(`📦 Found ${ungroupedMedia.length} ungrouped media`)

        if (ungroupedMedia.length === 0) {
          continue
        }

        // Apply grouping rules
        let proposals: any[] = []

        // RULE 1: Same Day
        if (config.sameDayGrouping) {
          const dayGroups = groupBySameDay(ungroupedMedia, config.sameDayMaxMedia)
          proposals.push(...dayGroups)
          console.log(`  ✓ Same day: ${dayGroups.length} groups`)
        }

        // RULE 2: Sequential Upload
        if (config.sequentialGrouping) {
          const seqGroups = groupBySequentialUpload(
            ungroupedMedia,
            config.sequentialTimeWindow
          )
          proposals.push(...seqGroups)
          console.log(`  ✓ Sequential: ${seqGroups.length} groups`)
        }

        // RULE 3: Similar Topics
        if (config.similarTopicsGrouping) {
          const topicGroups = groupBySimilarTopics(
            ungroupedMedia,
            config.topicSimilarityThreshold
          )
          proposals.push(...topicGroups)
          console.log(`  ✓ Similar topics: ${topicGroups.length} groups`)
        }

        // RULE 4: Event Detection
        if (config.eventDetection) {
          const eventGroups = detectEvents(ungroupedMedia, config.eventKeywords)
          proposals.push(...eventGroups)
          console.log(`  ✓ Event detection: ${eventGroups.length} groups`)
        }

        // Merge related groups if enabled
        if (config.mergeRelatedGroups && proposals.length > 0) {
          const beforeCount = proposals.length
          proposals = mergeRelatedGroups(proposals)
          console.log(`  ✓ Merged: ${beforeCount} → ${proposals.length} groups`)
        }

        // Filter groups based on min/max media limits
        proposals = proposals.filter(
          (g) =>
            g.mediaIds.length >= config.minMediaPerPost &&
            g.mediaIds.length <= config.maxMediaPerPost
        )

        console.log(`📊 Final groups: ${proposals.length}`)

        // Create MediaGroup entries
        for (const proposal of proposals) {
          try {
            // Determine story arc enum value
            let storyArcValue: any = null
            if (proposal.storyArc) {
              storyArcValue = proposal.storyArc
            }

            const mediaGroup = await prisma.mediaGroup.create({
              data: {
                tenantId: tenant.id,
                groupingRule: proposal.rule,
                groupingReason: proposal.reason,
                uploadDateStart: proposal.dateStart,
                uploadDateEnd: proposal.dateEnd,
                commonTopics: proposal.topics,
                detectedTheme: proposal.theme,
                storyArc: storyArcValue,
                groupConfidence: proposal.confidence,
                mediaCount: proposal.mediaIds.length,
                maxMediaPerPost: config.maxMediaPerPost,
                minMediaPerPost: config.minMediaPerPost,
                status: 'READY_FOR_POST',
              },
            })

            // Link media to group
            for (let i = 0; i < proposal.mediaIds.length; i++) {
              await prisma.syncedMedia.update({
                where: { id: proposal.mediaIds[i] },
                data: {
                  isGrouped: true,
                  mediaGroupId: mediaGroup.id,
                  groupOrder: i + 1,
                },
              })
            }

            console.log(`  ✅ Created group: ${mediaGroup.id} (${proposal.mediaIds.length} media)`)
            results.groupsCreated++
            results.mediaProcessed += proposal.mediaIds.length
          } catch (groupError: any) {
            console.error(`  ❌ Failed to create group:`, groupError.message)
            results.errors.push(`Group creation: ${groupError.message}`)
          }
        }

        results.processed++
        results.grouped += proposals.length
      } catch (tenantError: any) {
        console.error(`❌ Failed to process tenant ${tenant.name}:`, tenantError.message)
        results.errors.push(`Tenant ${tenant.name}: ${tenantError.message}`)
      }
    }

    console.log('\n✨ CRON: Media grouping complete')
    console.log(`📊 Results: ${results.groupsCreated} groups created, ${results.mediaProcessed} media grouped`)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (error: any) {
    console.error('❌ CRON: Media grouping failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to group media',
      },
      { status: 500 }
    )
  }
}

// Allow manual POST trigger
export async function POST(request: NextRequest) {
  return GET(request)
}
