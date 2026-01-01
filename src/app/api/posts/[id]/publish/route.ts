export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LinkedInClient } from '@/lib/linkedin/client'


export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify post belongs to tenant
    const post = await prisma.post.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Get LinkedIn client
    const linkedInClient = await LinkedInClient.getClientForTenant(session.user.tenantId)

    // Publish to LinkedIn
    let linkedInResponse
    
    if (post.mediaUrls && post.mediaUrls.length > 0) {
      // For now, publish text only
      // Full image support requires LinkedIn image upload flow
      linkedInResponse = await linkedInClient.shareTextPost(post.content)
    } else {
      linkedInResponse = await linkedInClient.shareTextPost(post.content)
    }

    // Update post status
    const updatedPost = await prisma.post.update({
      where: { id: params.id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      post: updatedPost,
      linkedIn: {
        id: linkedInResponse.id,
        activity: linkedInResponse.activity,
      },
      message: 'Post published to LinkedIn successfully',
    })
  } catch (error: any) {
    console.error('LinkedIn publish error:', error)
    
    // Update post status to FAILED
    try {
      await prisma.post.update({
        where: { id: params.id },
        data: {
          status: 'FAILED',
        },
      })
    } catch (updateError) {
      console.error('Failed to update post status:', updateError)
    }

    return NextResponse.json(
      { error: error.message || 'Failed to publish to LinkedIn' },
      { status: 500 }
    )
  }
}
