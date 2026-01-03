export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/integrations/google-drive/disconnect
 * Disconnect Google Drive integration
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (session.user.role !== 'TENANT_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can disconnect Drive' },
        { status: 403 }
      )
    }

    // Delete integration
    await prisma.cloudStorageIntegration.deleteMany({
      where: {
        tenantId: session.user.tenantId,
        provider: 'GOOGLE_DRIVE',
      },
    })

    console.log('✅ Google Drive disconnected for tenant:', session.user.tenantId)

    return NextResponse.json({
      success: true,
      message: 'Drive disconnected successfully',
    })
  } catch (error: any) {
    console.error('Drive disconnect failed:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect Drive' },
      { status: 500 }
    )
  }
}
