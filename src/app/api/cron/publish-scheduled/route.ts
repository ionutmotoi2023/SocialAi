export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publishToLinkedIn } from '@/lib/linkedin/client'

// This API route will be called by Vercel Cron every 15 minutes
// Or can be triggered manually for testing

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron or has auth token
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🔄 CRON: Starting scheduled posts check...')

    // Find all scheduled posts that should be published now
    const now = new Date()
    const postsToPublish = await prisma.post.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: {
          lte: now // scheduledAt is less than or equal to now
        }
      },
      include: {
        tenant: {
          include: {
            linkedinIntegrations: true
          }
        },
        user: true
      }
    })

    console.log(`📝 Found ${postsToPublish.length} posts to publish`)

    const results = {
      success: [] as string[],
      failed: [] as { id: string; error: string }[],
      total: postsToPublish.length
    }

    // Process each post
    for (const post of postsToPublish) {
      try {
        // Check if tenant has LinkedIn integration
        const linkedinIntegration = post.tenant.linkedinIntegrations?.[0]
        if (!linkedinIntegration) {
          throw new Error('LinkedIn not connected for this tenant')
        }

        // Check if LinkedIn integration is active
        if (!linkedinIntegration.isActive) {
          throw new Error('LinkedIn integration is not active')
        }

        // Publish to LinkedIn
        const linkedInPostUrl = await publishToLinkedIn(
          linkedinIntegration,
          {
            text: post.content,
            images: post.mediaUrls
          }
        )

        // Update post status to PUBLISHED
        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
            linkedinPostUrl: linkedInPostUrl
          }
        })

        console.log(`✅ Published post ${post.id} to LinkedIn`)
        results.success.push(post.id)

      } catch (error: any) {
        console.error(`❌ Failed to publish post ${post.id}:`, error)
        
        results.failed.push({
          id: post.id,
          error: error.message
        })

        // Update post with error
        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: 'FAILED',
            // Optionally store error in a new field
            // errorMessage: error.message
          }
        })

        // TODO: Send email notification to tenant admin
        // await sendErrorNotification(post.tenant, post, error)
      }
    }

    console.log('✨ CRON: Finished processing scheduled posts')

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results: {
        total: results.total,
        successful: results.success.length,
        failed: results.failed.length,
        successIds: results.success,
        failures: results.failed
      }
    })

  } catch (error: any) {
    console.error('❌ CRON: Error processing scheduled posts:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process scheduled posts',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

// Allow manual POST trigger for testing
export async function POST(request: NextRequest) {
  return GET(request)
}
