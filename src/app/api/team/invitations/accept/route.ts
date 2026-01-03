export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// POST /api/team/invitations/accept - Accept an invitation and create account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, name, password } = body

    if (!token || !name || !password) {
      return NextResponse.json(
        { error: 'Token, name, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Find invitation
    const invitation = await prisma.invitation.findUnique({
      where: { id: token },
      include: {
        tenant: true,
        inviter: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation' },
        { status: 404 }
      )
    }

    // Check if invitation is still valid
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This invitation has already been used or cancelled' },
        { status: 400 }
      )
    }

    if (new Date() > invitation.expiresAt) {
      // Mark as expired
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' }
      })
      
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user and mark invitation as accepted in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: invitation.email,
          name,
          password: hashedPassword,
          role: invitation.role,
          tenantId: invitation.tenantId,
          emailVerified: new Date() // Auto-verify since they came from invitation
        }
      })

      // Mark invitation as accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' }
      })

      return user
    })

    return NextResponse.json({
      user: {
        id: result.id,
        email: result.email,
        name: result.name
      },
      message: 'Account created successfully! You can now log in.'
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to accept invitation:', error)
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}
