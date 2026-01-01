export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/team/invite - Send team invitation

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (session.user.role !== 'TENANT_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can send invitations' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, role } = body

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    // Check if user already exists in tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        tenantId: session.user.tenantId
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User is already a member of this workspace' },
        { status: 400 }
      )
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        tenantId: session.user.tenantId,
        status: 'PENDING'
      }
    })

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email' },
        { status: 400 }
      )
    }

    // Create invitation (expires in 7 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invitation = await prisma.invitation.create({
      data: {
        email,
        role,
        tenantId: session.user.tenantId,
        invitedBy: session.user.id,
        status: 'PENDING',
        expiresAt
      },
      include: {
        inviter: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // TODO: Send email notification
    // await sendInvitationEmail(email, invitation)

    return NextResponse.json({
      invitation: {
        ...invitation,
        invitedBy: invitation.inviter
      },
      message: 'Invitation sent successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to send invitation:', error)
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    )
  }
}
