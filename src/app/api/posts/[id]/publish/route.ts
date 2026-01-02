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

    // Get request body
    const body = await req.json().catch(() => ({}))
    const { linkedInIntegrationId } = body

    if (!linkedInIntegrationId) {
      return NextResponse.json(
        { error: 'LinkedIn integration ID is required' },
        { status: 400 }
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

    // Verify integration belongs to tenant
    const integration = await prisma.linkedInIntegration.findFirst({
      where: {
        id: linkedInIntegrationId,
        tenantId: session.user.tenantId,
        isActive: true,
      },
    })

    if (!integration) {
      return NextResponse.json(
        { error: 'LinkedIn integration not found or inactive' },
        { status: 404 }
      )
    }

    console.log('📤 Publishing to LinkedIn:', {
      postId: post.id,
      integrationId: integration.id,
      profileType: integration.profileType,
      destination: integration.profileType === 'COMPANY_PAGE' 
        ? integration.organizationName 
        : integration.profileName,
      organizationUrn: integration.organizationUrn,
    })

    // Get LinkedIn client for this specific integration
    // Pass organizationUrn for company pages
    const linkedInClient = new LinkedInClient(
      integration.accessToken,
      session.user.tenantId,
      integration.organizationUrn || undefined // Pass org URN if company page
    )

    // Publish to LinkedIn
    let linkedInResponse
    
    if (post.mediaUrls && post.mediaUrls.length > 0) {
      console.log('📷 Post has images:', post.mediaUrls.length)
      // Use first image for now (LinkedIn API requires separate handling for multiple images)
      linkedInResponse = await linkedInClient.shareImagePost(post.content, post.mediaUrls[0])
    } else {
      console.log('📝 Text-only post')
      linkedInResponse = await linkedInClient.shareTextPost(post.content)
    }

    console.log('✅ LinkedIn publish success:', {
      linkedInId: linkedInResponse.id,
      activity: linkedInResponse.activity,
    })

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
      message: `Post published to ${integration.profileType === 'COMPANY_PAGE' 
        ? integration.organizationName 
        : integration.profileName} successfully`,
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
