export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/team/members/[id] - Remove team member
export const dynamic = 'force-dynamic'

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
        { error: 'Only admins can remove team members' },
        { status: 403 }
      )
    }

    const memberId = params.id

    // Cannot remove yourself
    if (memberId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot remove yourself' },
        { status: 400 }
      )
    }

    // Verify member belongs to tenant
    const member = await prisma.user.findFirst({
      where: {
        id: memberId,
        tenantId: session.user.tenantId
      }
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Remove the member
    await prisma.user.delete({
      where: { id: memberId }
    })

    return NextResponse.json({
      message: 'Member removed successfully'
    })
  } catch (error) {
    console.error('Failed to remove member:', error)
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    )
  }
}
