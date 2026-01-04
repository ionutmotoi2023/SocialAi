'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  HardDrive, 
  Image as ImageIcon, 
  Video, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ExternalLink,
  Eye,
  Layers
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

interface SyncedMedia {
  id: string
  fileName: string
  mediaUrl: string
  mediaType: 'IMAGE' | 'VIDEO'
  fileSize: number
  status: 'PENDING' | 'ANALYZING' | 'ANALYZED' | 'GENERATING' | 'GENERATED' | 'FAILED' | 'SKIPPED'
  aiAnalysisResult?: any
  aiDescription?: string
  aiSuggestedTopics?: string[]
  isGrouped: boolean
  postGenerated: boolean
  postId?: string
  createdAt: string
  updatedAt: string
}

export default function DrivMediaPage() {
  const { toast } = useToast()
  const [media, setMedia] = useState<SyncedMedia[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'analyzed' | 'grouped'>('all')

  useEffect(() => {
    fetchMedia()
  }, [])

  const fetchMedia = async () => {
    try {
      setIsLoading(true)
      console.log('🔍 [drive-media UI] Fetching media...')
      const response = await fetch('/api/drive-media')
      console.log('📡 [drive-media UI] Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 [drive-media UI] Received data:', {
          success: data.success,
          count: data.count,
          hasMedia: !!data.media,
          mediaLength: data.media?.length || 0,
          firstItem: data.media?.[0]
        })
        setMedia(data.media || [])
      } else {
        console.error('❌ [drive-media UI] Response not OK:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch media:', error)
      toast({
        title: 'Error',
        description: 'Failed to load synced media',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'bg-gray-500', icon: Clock, label: 'Pending' },
      ANALYZING: { color: 'bg-blue-500', icon: Loader2, label: 'Analyzing' },
      ANALYZED: { color: 'bg-green-500', icon: CheckCircle, label: 'Analyzed' },
      GENERATING: { color: 'bg-purple-500', icon: Loader2, label: 'Generating' },
      GENERATED: { color: 'bg-green-600', icon: CheckCircle, label: 'Generated' },
      FAILED: { color: 'bg-red-500', icon: AlertCircle, label: 'Failed' },
      SKIPPED: { color: 'bg-gray-400', icon: AlertCircle, label: 'Skipped' },
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const filteredMedia = media.filter(item => {
    if (filter === 'all') return true
    if (filter === 'pending') return item.status === 'PENDING' || item.status === 'ANALYZING'
    if (filter === 'analyzed') return item.status === 'ANALYZED'
    if (filter === 'grouped') return item.isGrouped
    return true
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading synced media...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Drive Media</h1>
            <p className="text-sm text-gray-600">
              Images and videos synced from Google Drive
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/dashboard/media-groups'}
            >
              <Layers className="mr-2 h-4 w-4" />
              View Groups
            </Button>
            <Button onClick={fetchMedia} variant="outline">
              <Loader2 className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
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
                    <p className="text-sm text-gray-600">Total Files</p>
                    <p className="text-2xl font-bold">{media.length}</p>
                  </div>
                  <HardDrive className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Analyzed</p>
                    <p className="text-2xl font-bold">
                      {media.filter(m => m.status === 'ANALYZED' || m.status === 'GENERATED').length}
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
                    <p className="text-sm text-gray-600">Grouped</p>
                    <p className="text-2xl font-bold">
                      {media.filter(m => m.isGrouped).length}
                    </p>
                  </div>
                  <ImageIcon className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Posts Created</p>
                    <p className="text-2xl font-bold">
                      {media.filter(m => m.postGenerated).length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-500" />
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
              All ({media.length})
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilter('pending')}
            >
              Pending ({media.filter(m => m.status === 'PENDING' || m.status === 'ANALYZING').length})
            </Button>
            <Button
              variant={filter === 'analyzed' ? 'default' : 'outline'}
              onClick={() => setFilter('analyzed')}
            >
              Analyzed ({media.filter(m => m.status === 'ANALYZED').length})
            </Button>
            <Button
              variant={filter === 'grouped' ? 'default' : 'outline'}
              onClick={() => setFilter('grouped')}
            >
              Grouped ({media.filter(m => m.isGrouped).length})
            </Button>
          </div>

          {/* Media Grid */}
          {filteredMedia.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <HardDrive className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No media found</h3>
                  <p className="text-gray-600 mb-4">
                    Upload images or videos to your Google Drive folder to get started
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/dashboard/settings/integrations'}
                  >
                    Configure Drive Sync
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMedia.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="relative aspect-video bg-gray-100">
                    {item.mediaType === 'IMAGE' ? (
                      <img
                        src={item.mediaUrl}
                        alt={item.fileName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Video className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate" title={item.fileName}>
                            {item.fileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(item.fileSize)} • {item.mediaType}
                          </p>
                        </div>
                      </div>

                      {item.aiDescription && (
                        <div className="text-sm text-gray-600 line-clamp-2">
                          {item.aiDescription}
                        </div>
                      )}

                      {item.aiSuggestedTopics && item.aiSuggestedTopics.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.aiSuggestedTopics.slice(0, 3).map((topic, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <div className="text-xs text-gray-500">
                          {format(new Date(item.createdAt), 'MMM dd, HH:mm')}
                        </div>
                        <div className="flex gap-1">
                          {item.isGrouped && (
                            <Badge variant="outline" className="text-xs">
                              Grouped
                            </Badge>
                          )}
                          {item.postGenerated && item.postId && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.location.href = `/dashboard/posts/${item.postId}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
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
