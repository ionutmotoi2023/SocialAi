export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateAuthUrl } from '@/lib/cloud-storage/google-drive'

/**
 * GET /api/integrations/google-drive/connect
 * Redirects user to Google OAuth consent screen
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (session.user.role !== 'TENANT_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can connect Drive' },
        { status: 403 }
      )
    }

    // Generate OAuth URL
    const authUrl = generateAuthUrl()

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error('Drive connect failed:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to connect Drive' },
      { status: 500 }
    )
  }
}
