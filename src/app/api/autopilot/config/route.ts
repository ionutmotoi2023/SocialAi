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

    const tenantId = session.user.tenantId

    // Get config from database or return default
    let config = await prisma.autoPilotConfig.findUnique({
      where: { tenantId }
    })

    // If no config exists, return defaults
    if (!config) {
      config = {
        id: '',
        tenantId,
        enabled: false,
        postsPerWeek: 5,
        confidenceThreshold: 0.8,
        autoSchedule: true,
        preferredTimes: ['09:00', '12:00', '17:00'],
        topics: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
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

    const tenantId = session.user.tenantId
    const body = await request.json()

    // Validate and extract config fields
    const {
      enabled,
      postsPerWeek,
      confidenceThreshold,
      autoSchedule,
      preferredTimes,
      topics
    } = body

    // Upsert config in database
    const config = await prisma.autoPilotConfig.upsert({
      where: { tenantId },
      update: {
        enabled: enabled ?? false,
        postsPerWeek: postsPerWeek ?? 5,
        confidenceThreshold: confidenceThreshold ?? 0.8,
        autoSchedule: autoSchedule ?? true,
        preferredTimes: preferredTimes ?? ['09:00', '12:00', '17:00'],
        topics: topics ?? []
      },
      create: {
        tenantId,
        enabled: enabled ?? false,
        postsPerWeek: postsPerWeek ?? 5,
        confidenceThreshold: confidenceThreshold ?? 0.8,
        autoSchedule: autoSchedule ?? true,
        preferredTimes: preferredTimes ?? ['09:00', '12:00', '17:00'],
        topics: topics ?? []
      }
    })

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
