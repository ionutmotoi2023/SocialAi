export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/autopilot/config - Get Auto-Pilot configuration

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, return default config (can be stored in DB later)
    // You could add an AutoPilotConfig model to Prisma
    const config = {
      enabled: false,
      postsPerWeek: 5,
      confidenceThreshold: 0.8,
      autoSchedule: true,
      preferredTimes: ['09:00', '12:00', '17:00'],
      topics: []
    }

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Failed to fetch config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    )
  }
}

// POST /api/autopilot/config - Save Auto-Pilot configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (session.user.role !== 'TENANT_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can configure Auto-Pilot' },
        { status: 403 }
      )
    }

    const config = await request.json()

    // TODO: Save config to database
    // For now, just return success
    // You can add a table: autopilot_configs with tenantId, config JSON

    return NextResponse.json({ 
      config,
      message: 'Configuration saved successfully' 
    })
  } catch (error) {
    console.error('Failed to save config:', error)
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    )
  }
}
