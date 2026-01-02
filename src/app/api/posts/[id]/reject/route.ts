export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/posts/[id]/reject - Reject a post (PENDING_APPROVAL -> DRAFT)
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

    // Check if user has permission to reject (TENANT_ADMIN or SUPER_ADMIN)
    if (session.user.role !== 'TENANT_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Only admins can reject posts' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { reason } = body // Optional rejection reason

    // Verify post exists and belongs to tenant
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

    // Check if post is in PENDING_APPROVAL status
    if (post.status !== 'PENDING_APPROVAL') {
      return NextResponse.json(
        { error: `Cannot reject post with status: ${post.status}` },
        { status: 400 }
      )
    }

    // Update post status to DRAFT (for review/editing)
    const updatedPost = await prisma.post.update({
      where: { id: params.id },
      data: {
        status: 'DRAFT',
        userApproved: false, // Track rejection for AI learning
        userModifications: reason || 'Post rejected by admin',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Track rejection for AI learning
    await prisma.aILearningData.create({
      data: {
        tenantId: session.user.tenantId,
        postId: params.id,
        interactionType: 'rejection',
        originalContent: post.content,
        userFeedback: reason || 'Post rejected by admin',
        improvementScore: 0.0, // Negative feedback
      },
    })

    console.log(`❌ Post ${params.id} rejected by ${session.user.email}`)

    return NextResponse.json({
      success: true,
      post: updatedPost,
      message: 'Post rejected and moved to drafts',
    })
  } catch (error) {
    console.error('Reject post error:', error)
    return NextResponse.json(
      { error: 'Failed to reject post' },
      { status: 500 }
    )
  }
}
