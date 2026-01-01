export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

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

    const body = await req.json()
    const { scheduledAt } = body

    if (!scheduledAt) {
      return NextResponse.json(
        { error: 'scheduledAt is required' },
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

    // Validate scheduled date is in the future
    const scheduledDate = new Date(scheduledAt)
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled date must be in the future' },
        { status: 400 }
      )
    }

    // Update post with scheduled date and status
    const updatedPost = await prisma.post.update({
      where: { id: params.id },
      data: {
        scheduledAt: scheduledDate,
        status: 'SCHEDULED',
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

    return NextResponse.json({
      success: true,
      post: updatedPost,
      message: `Post scheduled for ${scheduledDate.toISOString()}`,
    })
  } catch (error) {
    console.error('Schedule post error:', error)
    return NextResponse.json(
      { error: 'Failed to schedule post' },
      { status: 500 }
    )
  }
}
