/**
 * Smart Media Grouping Algorithms
 * Implements various rules for grouping media intelligently
 */

import { SyncedMedia, AutoPilotConfig } from '@prisma/client'

export interface MediaGroupProposal {
  mediaIds: string[]
  rule: 'SAME_DAY' | 'SIMILAR_TOPICS' | 'SAME_EVENT' | 'SEQUENTIAL' | 'SAME_FOLDER' | 'MIXED'
  reason: string
  confidence: number
  dateStart: Date
  dateEnd: Date
  topics: string[]
  theme?: string
  storyArc?: 'CHRONOLOGICAL' | 'BEFORE_AFTER' | 'COMPARISON' | 'COLLECTION'
}

/**
 * RULE 1: Group by Same Day
 * Groups all media uploaded on the same calendar day
 */
export function groupBySameDay(
  media: SyncedMedia[],
  maxPerGroup: number = 10
): MediaGroupProposal[] {
  const groups: MediaGroupProposal[] = []

  // Group by date (YYYY-MM-DD)
  const byDate = new Map<string, SyncedMedia[]>()

  media.forEach((m) => {
    if (!m.uploadedAt) return
    const dateKey = m.uploadedAt.toISOString().split('T')[0]
    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, [])
    }
    byDate.get(dateKey)!.push(m)
  })

  // Create groups
  byDate.forEach((mediaList, dateKey) => {
    if (mediaList.length === 0) return

    // Split into chunks if exceeds max
    for (let i = 0; i < mediaList.length; i += maxPerGroup) {
      const chunk = mediaList.slice(i, i + maxPerGroup)
      
      // Extract common topics
      const allTopics = chunk.flatMap((m) => m.aiSuggestedTopics || [])
      const topicCounts = new Map<string, number>()
      allTopics.forEach((topic) => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)
      })
      const commonTopics = Array.from(topicCounts.entries())
        .filter(([_, count]) => count >= chunk.length * 0.5) // Present in 50%+ of media
        .map(([topic]) => topic)
        .slice(0, 5)

      groups.push({
        mediaIds: chunk.map((m) => m.id),
        rule: 'SAME_DAY',
        reason: `Media uploaded on ${dateKey}`,
        confidence: 0.85,
        dateStart: chunk[0].uploadedAt!,
        dateEnd: chunk[chunk.length - 1].uploadedAt!,
        topics: commonTopics,
        storyArc: chunk.length >= 3 ? 'CHRONOLOGICAL' : 'COLLECTION',
      })
    }
  })

  return groups
}

/**
 * RULE 2: Group by Sequential Upload
 * Groups media uploaded within X hours of each other
 */
export function groupBySequentialUpload(
  media: SyncedMedia[],
  timeWindowHours: number = 3
): MediaGroupProposal[] {
  const groups: MediaGroupProposal[] = []
  const sorted = [...media].sort(
    (a, b) => (a.uploadedAt?.getTime() || 0) - (b.uploadedAt?.getTime() || 0)
  )

  let currentGroup: SyncedMedia[] = []
  let lastTime: Date | null = null

  for (const m of sorted) {
    if (!m.uploadedAt) continue

    if (!lastTime || m.uploadedAt.getTime() - lastTime.getTime() <= timeWindowHours * 60 * 60 * 1000) {
      currentGroup.push(m)
      lastTime = m.uploadedAt
    } else {
      // Save current group if it has 2+ media
      if (currentGroup.length >= 2) {
        groups.push(createGroupFromMedia(currentGroup, 'SEQUENTIAL'))
      }
      // Start new group
      currentGroup = [m]
      lastTime = m.uploadedAt
    }
  }

  // Don't forget last group
  if (currentGroup.length >= 2) {
    groups.push(createGroupFromMedia(currentGroup, 'SEQUENTIAL'))
  }

  return groups
}

/**
 * RULE 3: Group by Similar Topics
 * Groups media with overlapping topics above threshold
 */
export function groupBySimilarTopics(
  media: SyncedMedia[],
  similarityThreshold: number = 0.6
): MediaGroupProposal[] {
  const groups: MediaGroupProposal[] = []
  const processed = new Set<string>()

  for (let i = 0; i < media.length; i++) {
    if (processed.has(media[i].id)) continue

    const baseMedia = media[i]
    const baseTopics = new Set(baseMedia.aiSuggestedTopics || [])
    
    if (baseTopics.size === 0) continue

    const similarMedia = [baseMedia]
    processed.add(baseMedia.id)

    // Find similar media
    for (let j = i + 1; j < media.length; j++) {
      if (processed.has(media[j].id)) continue

      const compareTopics = new Set(media[j].aiSuggestedTopics || [])
      const intersection = new Set([...baseTopics].filter((t) => compareTopics.has(t)))
      const union = new Set([...baseTopics, ...compareTopics])

      // Jaccard similarity
      const similarity = intersection.size / union.size

      if (similarity >= similarityThreshold) {
        similarMedia.push(media[j])
        processed.add(media[j].id)
      }
    }

    // Create group if 2+ media
    if (similarMedia.length >= 2) {
      groups.push(createGroupFromMedia(similarMedia, 'SIMILAR_TOPICS'))
    }
  }

  return groups
}

/**
 * RULE 4: Detect Events
 * Groups media that appear to be from the same event based on context/keywords
 */
export function detectEvents(
  media: SyncedMedia[],
  eventKeywords: string[] = []
): MediaGroupProposal[] {
  const groups: MediaGroupProposal[] = []
  
  // Group by detected context
  const byContext = new Map<string, SyncedMedia[]>()

  media.forEach((m) => {
    const context = m.aiContext?.toLowerCase() || 'unknown'
    
    // Check for event keywords
    const hasEventKeyword = eventKeywords.some((keyword) =>
      context.includes(keyword.toLowerCase()) ||
      (m.aiDescription?.toLowerCase() || '').includes(keyword.toLowerCase())
    )

    if (hasEventKeyword || ['meeting', 'conference', 'event', 'presentation', 'workshop'].some((k) => context.includes(k))) {
      if (!byContext.has(context)) {
        byContext.set(context, [])
      }
      byContext.get(context)!.push(m)
    }
  })

  // Create groups
  byContext.forEach((mediaList, context) => {
    if (mediaList.length >= 2) {
      groups.push({
        ...createGroupFromMedia(mediaList, 'SAME_EVENT'),
        theme: context,
      })
    }
  })

  return groups
}

/**
 * Helper: Create group from media list
 */
function createGroupFromMedia(
  media: SyncedMedia[],
  rule: MediaGroupProposal['rule']
): MediaGroupProposal {
  // Sort by upload time
  const sorted = [...media].sort(
    (a, b) => (a.uploadedAt?.getTime() || 0) - (b.uploadedAt?.getTime() || 0)
  )

  // Extract common topics
  const allTopics = sorted.flatMap((m) => m.aiSuggestedTopics || [])
  const topicCounts = new Map<string, number>()
  allTopics.forEach((topic) => {
    topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)
  })
  const commonTopics = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic)

  // Detect story arc
  let storyArc: MediaGroupProposal['storyArc'] = 'COLLECTION'
  if (sorted.length === 2) {
    storyArc = 'BEFORE_AFTER'
  } else if (sorted.length >= 3) {
    storyArc = 'CHRONOLOGICAL'
  }

  // Calculate confidence
  const confidence = Math.min(0.9, 0.6 + commonTopics.length * 0.05)

  return {
    mediaIds: sorted.map((m) => m.id),
    rule,
    reason: `${rule}: ${sorted.length} media with common topics: ${commonTopics.slice(0, 3).join(', ')}`,
    confidence,
    dateStart: sorted[0].uploadedAt || new Date(),
    dateEnd: sorted[sorted.length - 1].uploadedAt || new Date(),
    topics: commonTopics,
    storyArc,
  }
}

/**
 * Calculate topic similarity between two media
 */
export function calculateTopicSimilarity(
  media1: SyncedMedia,
  media2: SyncedMedia
): number {
  const topics1 = new Set(media1.aiSuggestedTopics || [])
  const topics2 = new Set(media2.aiSuggestedTopics || [])

  if (topics1.size === 0 || topics2.size === 0) return 0

  const intersection = new Set([...topics1].filter((t) => topics2.has(t)))
  const union = new Set([...topics1, ...topics2])

  return intersection.size / union.size
}

/**
 * Merge overlapping groups
 * If two groups share 50%+ of media, merge them
 */
export function mergeRelatedGroups(
  groups: MediaGroupProposal[]
): MediaGroupProposal[] {
  const merged: MediaGroupProposal[] = []
  const processed = new Set<number>()

  for (let i = 0; i < groups.length; i++) {
    if (processed.has(i)) continue

    let currentGroup = groups[i]
    processed.add(i)

    // Find overlapping groups
    for (let j = i + 1; j < groups.length; j++) {
      if (processed.has(j)) continue

      const group2 = groups[j]
      const set1 = new Set(currentGroup.mediaIds)
      const set2 = new Set(group2.mediaIds)
      const intersection = new Set([...set1].filter((id) => set2.has(id)))

      // If 50%+ overlap, merge
      if (intersection.size >= Math.min(set1.size, set2.size) * 0.5) {
        const allIds = [...new Set([...currentGroup.mediaIds, ...group2.mediaIds])]
        const allTopics = [...new Set([...currentGroup.topics, ...group2.topics])]

        currentGroup = {
          mediaIds: allIds,
          rule: 'MIXED',
          reason: `Merged: ${currentGroup.reason} + ${group2.reason}`,
          confidence: (currentGroup.confidence + group2.confidence) / 2,
          dateStart:
            currentGroup.dateStart < group2.dateStart
              ? currentGroup.dateStart
              : group2.dateStart,
          dateEnd:
            currentGroup.dateEnd > group2.dateEnd ? currentGroup.dateEnd : group2.dateEnd,
          topics: allTopics.slice(0, 5),
          storyArc: allIds.length >= 3 ? 'CHRONOLOGICAL' : 'COLLECTION',
        }

        processed.add(j)
      }
    }

    merged.push(currentGroup)
  }

  return merged
}
