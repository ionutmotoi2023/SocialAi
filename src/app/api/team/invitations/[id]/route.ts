export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/team/invitations/[id] - Cancel invitation

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (session.user.role !== 'TENANT_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can cancel invitations' },
        { status: 403 }
      )
    }

    const invitationId = params.id

    // Verify invitation belongs to tenant
    const invitation = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
        tenantId: session.user.tenantId
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Delete the invitation
    await prisma.invitation.delete({
      where: { id: invitationId }
    })

    return NextResponse.json({
      message: 'Invitation cancelled successfully'
    })
  } catch (error) {
    console.error('Failed to cancel invitation:', error)
    return NextResponse.json(
      { error: 'Failed to cancel invitation' },
      { status: 500 }
    )
  }
}
