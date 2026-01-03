'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Layers, 
  Image as ImageIcon, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Eye,
  Calendar,
  Sparkles
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

interface MediaGroup {
  id: string
  groupingRule: string
  groupingReason?: string
  uploadDateStart: string
  uploadDateEnd?: string
  commonTopics?: string[]
  detectedTheme?: string
  storyArc?: 'CHRONOLOGICAL' | 'BEFORE_AFTER' | 'COLLECTION' | null
  groupConfidence: number
  mediaCount: number
  status: 'PENDING' | 'READY_FOR_POST' | 'PROCESSED' | 'FAILED'
  postId?: string
  createdAt: string
  processedAt?: string
  syncedMedia?: any[]
  post?: any
}

export default function MediaGroupsPage() {
  const { toast } = useToast()
  const [groups, setGroups] = useState<MediaGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'ready' | 'processed'>('all')

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/media-groups')
      if (response.ok) {
        const data = await response.json()
        setGroups(data.groups || [])
      }
    } catch (error) {
      console.error('Failed to fetch media groups:', error)
      toast({
        title: 'Error',
        description: 'Failed to load media groups',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'bg-gray-500', icon: Clock, label: 'Pending' },
      READY_FOR_POST: { color: 'bg-blue-500', icon: Sparkles, label: 'Ready' },
      PROCESSED: { color: 'bg-green-500', icon: CheckCircle, label: 'Processed' },
      FAILED: { color: 'bg-red-500', icon: AlertCircle, label: 'Failed' },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getGroupingRuleLabel = (rule: string) => {
    const labels: Record<string, string> = {
      SAME_DAY: 'Same Day',
      SEQUENTIAL: 'Sequential Upload',
      SIMILAR_TOPICS: 'Similar Topics',
      EVENT_DETECTION: 'Event',
      SAME_FOLDER: 'Same Folder',
    }
    return labels[rule] || rule
  }

  const getStoryArcIcon = (storyArc: string | null) => {
    if (!storyArc) return null
    
    const icons: Record<string, string> = {
      CHRONOLOGICAL: '📅',
      BEFORE_AFTER: '🔄',
      COLLECTION: '📚',
    }
    return icons[storyArc]
  }

  const filteredGroups = groups.filter(group => {
    if (filter === 'all') return true
    if (filter === 'ready') return group.status === 'READY_FOR_POST'
    if (filter === 'processed') return group.status === 'PROCESSED'
    return true
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading media groups...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Media Groups</h1>
            <p className="text-sm text-gray-600">
              Smart grouping of related media for multi-image posts
            </p>
          </div>
          <Button onClick={fetchGroups} variant="outline">
            <Loader2 className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Groups</p>
                    <p className="text-2xl font-bold">{groups.length}</p>
                  </div>
                  <Layers className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Ready for Post</p>
                    <p className="text-2xl font-bold">
                      {groups.filter(g => g.status === 'READY_FOR_POST').length}
                    </p>
                  </div>
                  <Sparkles className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Processed</p>
                    <p className="text-2xl font-bold">
                      {groups.filter(g => g.status === 'PROCESSED').length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Media</p>
                    <p className="text-2xl font-bold">
                      {groups.reduce((sum, g) => sum + g.mediaCount, 0)}
                    </p>
                  </div>
                  <ImageIcon className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All ({groups.length})
            </Button>
            <Button
              variant={filter === 'ready' ? 'default' : 'outline'}
              onClick={() => setFilter('ready')}
            >
              Ready ({groups.filter(g => g.status === 'READY_FOR_POST').length})
            </Button>
            <Button
              variant={filter === 'processed' ? 'default' : 'outline'}
              onClick={() => setFilter('processed')}
            >
              Processed ({groups.filter(g => g.status === 'PROCESSED').length})
            </Button>
          </div>

          {/* Groups Grid */}
          {filteredGroups.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Layers className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No media groups found</h3>
                  <p className="text-gray-600 mb-4">
                    Upload multiple images to your Google Drive folder to create smart groups
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/dashboard/drive-media'}
                  >
                    View Synced Media
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredGroups.map((group) => (
                <Card key={group.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">
                            {group.detectedTheme || 'Media Group'}
                          </h3>
                          {getStatusBadge(group.status)}
                          <Badge variant="outline">
                            {getGroupingRuleLabel(group.groupingRule)}
                          </Badge>
                          {group.storyArc && (
                            <Badge variant="secondary">
                              {getStoryArcIcon(group.storyArc)} {group.storyArc.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                        
                        {group.groupingReason && (
                          <p className="text-sm text-gray-600 mb-2">
                            {group.groupingReason}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <ImageIcon className="h-4 w-4" />
                            {group.mediaCount} {group.mediaCount === 1 ? 'file' : 'files'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(new Date(group.uploadDateStart), 'MMM dd, yyyy')}
                            {group.uploadDateEnd && group.uploadDateEnd !== group.uploadDateStart && (
                              <> - {format(new Date(group.uploadDateEnd), 'MMM dd, yyyy')}</>
                            )}
                          </div>
                          <div>
                            Confidence: {(group.groupConfidence * 100).toFixed(0)}%
                          </div>
                        </div>

                        {group.commonTopics && group.commonTopics.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {group.commonTopics.map((topic, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                #{topic}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {group.postId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.location.href = `/dashboard/posts/${group.postId}`}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Post
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Media Preview */}
                    {group.syncedMedia && group.syncedMedia.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-4">
                        {group.syncedMedia.slice(0, 6).map((media: any) => (
                          <div key={media.id} className="relative aspect-square bg-gray-100 rounded overflow-hidden">
                            {media.mediaType === 'IMAGE' ? (
                              <img
                                src={media.mediaUrl}
                                alt={media.fileName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full bg-gray-200">
                                <ImageIcon className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                        ))}
                        {group.syncedMedia.length > 6 && (
                          <div className="relative aspect-square bg-gray-100 rounded flex items-center justify-center">
                            <p className="text-sm font-semibold text-gray-600">
                              +{group.syncedMedia.length - 6} more
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
