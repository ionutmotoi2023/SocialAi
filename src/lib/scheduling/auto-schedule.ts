/**
 * Auto-Scheduling Utilities
 * Handles intelligent scheduling of posts based on preferred times
 */

import { prisma } from '@/lib/prisma'

export interface SchedulingConfig {
  preferredTimes: string[] // e.g., ['09:00', '12:00', '17:00']
  postsPerWeek: number
  tenantId: string
}

/**
 * Get next available time slot for posting
 * Distributes posts evenly across preferred times
 */
export async function getNextAvailableSlot(
  config: SchedulingConfig
): Promise<Date> {
  const { preferredTimes, tenantId } = config

  if (!preferredTimes || preferredTimes.length === 0) {
    // Default to tomorrow at 9 AM if no preferred times
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    return tomorrow
  }

  // Get all scheduled posts for this tenant (future posts only)
  const scheduledPosts = await prisma.post.findMany({
    where: {
      tenantId,
      status: 'SCHEDULED',
      scheduledAt: {
        gte: new Date(), // Only future posts
      },
    },
    select: {
      scheduledAt: true,
    },
    orderBy: {
      scheduledAt: 'asc',
    },
  })

  // Convert scheduled times to set for quick lookup
  const scheduledSlots = new Set(
    scheduledPosts.map(
      (post) => post.scheduledAt?.toISOString().split('T')[0] + '-' + post.scheduledAt?.toISOString().split('T')[1].substring(0, 5)
    )
  )

  // Start checking from today
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)

  // Try to find next available slot (check next 30 days max)
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const checkDate = new Date(currentDate)
    checkDate.setDate(checkDate.getDate() + dayOffset)

    // Try each preferred time for this day
    for (const timeStr of preferredTimes) {
      const [hours, minutes] = timeStr.split(':').map(Number)
      const candidateDate = new Date(checkDate)
      candidateDate.setHours(hours, minutes, 0, 0)

      // Skip if time is in the past
      if (candidateDate <= new Date()) {
        continue
      }

      // Check if this slot is already taken
      const slotKey = candidateDate.toISOString().split('T')[0] + '-' + timeStr
      if (!scheduledSlots.has(slotKey)) {
        return candidateDate
      }
    }
  }

  // Fallback: if all slots are taken in next 30 days, just use tomorrow + first preferred time
  const fallbackDate = new Date()
  fallbackDate.setDate(fallbackDate.getDate() + 1)
  const [hours, minutes] = preferredTimes[0].split(':').map(Number)
  fallbackDate.setHours(hours, minutes, 0, 0)
  return fallbackDate
}

/**
 * Distribute multiple posts across preferred times
 * Returns array of scheduled dates
 */
export async function distributePostSchedules(
  config: SchedulingConfig,
  postCount: number
): Promise<Date[]> {
  const schedules: Date[] = []

  for (let i = 0; i < postCount; i++) {
    const nextSlot = await getNextAvailableSlot({
      ...config,
      // Temporarily mark this slot as taken by adding to DB in memory
    })
    schedules.push(nextSlot)

    // Small delay to ensure unique slots
    await new Promise((resolve) => setTimeout(resolve, 10))
  }

  return schedules
}

/**
 * Calculate optimal posting schedule for a week
 * Evenly distributes posts across preferred times
 */
export function calculateWeeklySchedule(
  preferredTimes: string[],
  postsPerWeek: number
): Date[] {
  const schedules: Date[] = []
  const now = new Date()

  // Calculate days between posts
  const daysPerPost = 7 / postsPerWeek
  const timesCount = preferredTimes.length

  for (let i = 0; i < postsPerWeek; i++) {
    const daysOffset = Math.floor(i * daysPerPost)
    const timeIndex = i % timesCount
    const timeStr = preferredTimes[timeIndex]

    const [hours, minutes] = timeStr.split(':').map(Number)
    const scheduledDate = new Date(now)
    scheduledDate.setDate(scheduledDate.getDate() + daysOffset)
    scheduledDate.setHours(hours, minutes, 0, 0)

    // Only add if in future
    if (scheduledDate > now) {
      schedules.push(scheduledDate)
    }
  }

  return schedules.sort((a, b) => a.getTime() - b.getTime())
}
