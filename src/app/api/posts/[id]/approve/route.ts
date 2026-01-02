export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/posts/[id]/approve - Approve a post (PENDING_APPROVAL -> APPROVED)
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

    // Check if user has permission to approve (TENANT_ADMIN or SUPER_ADMIN)
    if (session.user.role !== 'TENANT_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Only admins can approve posts' },
        { status: 403 }
      )
    }

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
        { error: `Cannot approve post with status: ${post.status}` },
        { status: 400 }
      )
    }

    // Update post status to APPROVED
    const updatedPost = await prisma.post.update({
      where: { id: params.id },
      data: {
        status: 'APPROVED',
        userApproved: true, // Track approval for AI learning
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

    // Track approval for AI learning
    await prisma.aILearningData.create({
      data: {
        tenantId: session.user.tenantId,
        postId: params.id,
        interactionType: 'approval',
        originalContent: post.content,
        userFeedback: 'Post approved by admin',
        improvementScore: 1.0, // Positive feedback
      },
    })

    console.log(`✅ Post ${params.id} approved by ${session.user.email}`)

    return NextResponse.json({
      success: true,
      post: updatedPost,
      message: 'Post approved successfully',
    })
  } catch (error) {
    console.error('Approve post error:', error)
    return NextResponse.json(
      { error: 'Failed to approve post' },
      { status: 500 }
    )
  }
}
