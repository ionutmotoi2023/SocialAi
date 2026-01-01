export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { LinkedInClient } from '@/lib/linkedin/client'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get LinkedIn client for tenant
    const client = await LinkedInClient.getClientForTenant(session.user.tenantId)

    // Test connection by fetching profile
    const profile = await client.getProfile()

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        vanityName: profile.vanityName,
      },
      message: 'LinkedIn connection is working!',
    })
  } catch (error: any) {
    console.error('LinkedIn test error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to test LinkedIn connection' },
      { status: 500 }
    )
  }
}
