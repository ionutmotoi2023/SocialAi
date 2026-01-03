export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateContent } from '@/lib/ai/openai'
import { getNextAvailableSlot } from '@/lib/scheduling/auto-schedule'

/**
 * CRON Job: Auto-Generate Posts from Drive Media
 * Runs every 30 minutes
 * Generates posts from ready MediaGroups
 */
export async function GET(request: NextRequest) {
  try {
    // Verify CRON secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✍️  CRON: Starting auto-generate from Drive...')

    // Find ready media groups (limit to 5 per run)
    const readyGroups = await prisma.mediaGroup.findMany({
      where: {
        status: 'READY_FOR_POST',
      },
      include: {
        media: {
          orderBy: { groupOrder: 'asc' },
        },
        tenant: {
          include: {
            aiConfigs: true,
            autoPilotConfigs: true,
            users: {
              where: {
                OR: [{ role: 'TENANT_ADMIN' }, { role: 'SUPER_ADMIN' }],
              },
              take: 1,
            },
          },
        },
      },
      take: 5,
      orderBy: { createdAt: 'asc' },
    })

    console.log(`📝 Found ${readyGroups.length} groups ready for post generation`)

    if (readyGroups.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No groups ready for post generation',
        generated: 0,
      })
    }

    const results = {
      generated: 0,
      scheduled: 0,
      pendingApproval: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const group of readyGroups) {
      try {
        console.log(`\n✍️  Generating post for group: ${group.id}`)
        console.log(`   Media count: ${group.media.length}`)
        console.log(`   Topics: ${group.commonTopics.join(', ')}`)

        // Update status to GENERATING
        await prisma.mediaGroup.update({
          where: { id: group.id },
          data: { status: 'GENERATING' },
        })

        const tenant = group.tenant
        const aiConfig = tenant.aiConfigs[0]
        const autopilotConfig = tenant.autoPilotConfigs[0]
        const adminUser = tenant.users[0]

        if (!aiConfig || !adminUser) {
          throw new Error('Missing AI config or admin user')
        }

        // Build comprehensive context from all media
        const mediaDescriptions = group.media
          .map((m, idx) => `[Image ${idx + 1}]: ${m.aiDescription}\nMood: ${m.aiMood}\nContext: ${m.aiContext}`)
          .join('\n\n')

        // Build prompt for GPT-4o
        const prompt = `Create an engaging LinkedIn post based on these ${group.media.length} images that tell a cohesive story:

${mediaDescriptions}

Common themes: ${group.commonTopics.join(', ')}
${group.detectedTheme ? `Overall theme: ${group.detectedTheme}` : ''}
${group.storyArc ? `Story type: ${group.storyArc}` : ''}

Requirements:
- Create a compelling narrative that connects all ${group.media.length} images
- Match the brand voice and tone
- Include relevant hashtags
- Add a clear call-to-action
- Make it authentic and engaging for LinkedIn audience
${group.storyArc === 'CHRONOLOGICAL' ? '- Tell a timeline/progression story' : ''}
${group.storyArc === 'BEFORE_AFTER' ? '- Highlight the transformation/change' : ''}
${group.storyArc === 'COLLECTION' ? '- Showcase the variety/collection' : ''}

Brand context: ${tenant.name}${tenant.industry ? ` in ${tenant.industry}` : ''}`

        // Generate content
        const startTime = Date.now()
        const result = await generateContent({
          prompt,
          brandVoice: aiConfig.brandVoice || undefined,
          additionalInstructions: aiConfig.additionalInstructions || undefined,
          brandVariables: {
            companyName: aiConfig.companyName || tenant.name,
            companyTagline: aiConfig.companyTagline || undefined,
            targetAudience: aiConfig.targetAudience || undefined,
            keyProducts: aiConfig.keyProducts || undefined,
            uniqueValue: aiConfig.uniqueValue || undefined,
          },
          tone: aiConfig.tonePreference as any,
          includeHashtags: true,
          includeCTA: aiConfig.includeCTA,
          includeEmojis: aiConfig.includeEmojis,
          platform: 'linkedin',
        })

        const generationTime = Math.round((Date.now() - startTime) / 1000)

        console.log(`   Generated content (confidence: ${result.confidence})`)
        console.log(`   Title: ${result.title}`)

        // Determine status based on confidence and auto-approve settings
        let postStatus: 'SCHEDULED' | 'PENDING_APPROVAL' = 'PENDING_APPROVAL'
        let scheduledAt: Date | null = null

        const shouldAutoApprove =
          autopilotConfig?.driveAutoApprove &&
          result.confidence >= autopilotConfig.confidenceThreshold

        if (shouldAutoApprove && autopilotConfig?.autoSchedule) {
          // Auto-schedule high-confidence posts
          scheduledAt = await getNextAvailableSlot({
            preferredTimes: autopilotConfig.preferredTimes,
            postsPerWeek: autopilotConfig.postsPerWeek,
            tenantId: tenant.id,
          })
          postStatus = 'SCHEDULED'
          console.log(`   ✅ Auto-scheduled for: ${scheduledAt.toISOString()}`)
          results.scheduled++
        } else {
          console.log(`   ⏸️  Pending approval (confidence: ${result.confidence})`)
          results.pendingApproval++
        }

        // Get media URLs in order
        const mediaUrls = group.media.map((m) => m.localUrl!)

        // Create post
        const post = await prisma.post.create({
          data: {
            tenantId: tenant.id,
            userId: adminUser.id,
            title: result.title,
            content: result.text,
            mediaUrls,
            mediaOrder: group.media.map((_, idx) => idx), // Maintain group order
            status: postStatus,
            scheduledAt,
            aiGenerated: true,
            aiModel: aiConfig.selectedModel,
            aiConfidence: result.confidence,
            originalPrompt: `Auto-generated from Drive media group ${group.id}`,
            generationTime,
            mediaGroupId: group.id,
            storyArcType: group.storyArc || undefined,
          },
        })

        console.log(`   💾 Post created: ${post.id}`)

        // Update media group
        await prisma.mediaGroup.update({
          where: { id: group.id },
          data: {
            status: 'POSTED',
            postIds: [post.id],
            processedAt: new Date(),
          },
        })

        // Update media records
        await prisma.syncedMedia.updateMany({
          where: { mediaGroupId: group.id },
          data: { postGenerated: true },
        })

        results.generated++
      } catch (error: any) {
        console.error(`❌ Failed to generate post for group ${group.id}:`, error.message)

        // Update group status to FAILED
        await prisma.mediaGroup.update({
          where: { id: group.id },
          data: { status: 'FAILED' },
        })

        results.failed++
        results.errors.push(`Group ${group.id}: ${error.message}`)
      }
    }

    console.log('\n✨ CRON: Auto-generate complete')
    console.log(`📊 Results: ${results.generated} posts generated (${results.scheduled} scheduled, ${results.pendingApproval} pending approval)`)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (error: any) {
    console.error('❌ CRON: Auto-generate failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to auto-generate posts',
      },
      { status: 500 }
    )
  }
}

// Allow manual POST trigger
export async function POST(request: NextRequest) {
  return GET(request)
}
