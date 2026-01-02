'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { RSSSourceCard } from '@/components/posts/rss-source-card'
import { ArrowLeft, Home, Save, Trash2, Calendar, Send, Loader2, Image as ImageIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ImageUpload } from '@/components/upload/image-upload'

interface Post {
  id: string
  title?: string
  content: string
  mediaUrls: string[]
  status: string
  platform: string
  scheduledAt?: string
  publishedAt?: string
  aiGenerated: boolean
  aiModel?: string
  aiConfidence?: number
  createdAt: string
  // RSS Source tracking
  contentSourceId?: string
  rssItemTitle?: string
  rssItemUrl?: string
  rssItemDate?: string
  user: {
    id: string
    name?: string
    email: string
  }
  contentSource?: {
    id: string
    name: string
    url: string
  }
}

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [post, setPost] = useState<Post | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)

  useEffect(() => {
    fetchPost()
  }, [params.id])

  const fetchPost = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/posts/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setPost(data)
        setEditedTitle(data.title || '')
        setEditedContent(data.content)
        setMediaUrls(data.mediaUrls || [])
        
        if (data.scheduledAt) {
          const scheduled = new Date(data.scheduledAt)
          setScheduledDate(format(scheduled, 'yyyy-MM-dd'))
          setScheduledTime(format(scheduled, 'HH:mm'))
        }
      } else {
        throw new Error('Post not found')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load post',
        variant: 'destructive',
      })
      router.push('/dashboard/posts')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const scheduledAt = scheduledDate && scheduledTime
        ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
        : null

      const response = await fetch(`/api/posts/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editedTitle,
          content: editedContent,
          mediaUrls,
          scheduledAt,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save post')
      }

      toast({
        title: 'Success',
        description: 'Post updated successfully',
      })

      fetchPost()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save post',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublishNow = async () => {
    if (!confirm('Publish this post to LinkedIn now?')) {
      return
    }

    setIsPublishing(true)

    try {
      // First, save any changes
      await handleSave()

      // Then publish
      const response = await fetch(`/api/posts/${params.id}/publish`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to publish post')
      }

      toast({
        title: 'Success',
        description: 'Post published to LinkedIn successfully',
      })

      // Refresh post data
      await fetchPost()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish post',
        variant: 'destructive',
      })
    } finally {
      setIsPublishing(false)
    }
  }

  const handleSchedule = async () => {
    setIsScheduling(true)

    try {
      // Validate schedule date/time
      if (!scheduledDate || !scheduledTime) {
        toast({
          title: 'Missing schedule',
          description: 'Please select both date and time to schedule',
          variant: 'destructive',
        })
        return
      }

      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`)
      
      // Check if date is in the future
      if (scheduledAt <= new Date()) {
        toast({
          title: 'Invalid schedule',
          description: 'Please select a future date and time',
          variant: 'destructive',
        })
        return
      }

      // Save with scheduled status
      const response = await fetch(`/api/posts/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editedTitle,
          content: editedContent,
          mediaUrls,
          scheduledAt: scheduledAt.toISOString(),
          status: 'SCHEDULED',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to schedule post')
      }

      toast({
        title: 'Success',
        description: `Post scheduled for ${format(scheduledAt, 'PPp')}`,
      })

      // Refresh post data
      await fetchPost()
      
      // Redirect to calendar
      router.push('/dashboard/calendar')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to schedule post',
        variant: 'destructive',
      })
    } finally {
      setIsScheduling(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/posts/${params.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete post')
      }

      toast({
        title: 'Success',
        description: 'Post deleted successfully',
      })

      router.push('/dashboard/posts')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete post',
        variant: 'destructive',
      })
      setIsDeleting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string }> = {
      DRAFT: { color: 'bg-gray-500', label: 'Draft' },
      APPROVED: { color: 'bg-blue-500', label: 'Approved' },
      SCHEDULED: { color: 'bg-purple-500', label: 'Scheduled' },
      PUBLISHED: { color: 'bg-green-500', label: 'Published' },
      FAILED: { color: 'bg-red-500', label: 'Failed' },
    }

    const { color, label } = config[status] || config.DRAFT

    return <Badge className={color}>{label}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading post...</p>
        </div>
      </div>
    )
  }

  if (!post) {
    return null
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/dashboard/posts')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/dashboard')}
                className="lg:hidden"
                title="Go to Home"
              >
                <Home className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Post</h1>
                <p className="text-sm text-gray-600">
                  Created by {post.user.name || post.user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(post.status)}
              
              {/* Draft and Approved Actions - Show Publish/Schedule buttons */}
              {(post.status === 'DRAFT' || post.status === 'APPROVED') && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleSchedule}
                    disabled={isScheduling || isSaving}
                  >
                    {isScheduling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scheduling...
                      </>
                    ) : (
                      <>
                        <Calendar className="mr-2 h-4 w-4" />
                        Schedule
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handlePublishNow}
                    disabled={isPublishing || isSaving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Publish Now
                      </>
                    )}
                  </Button>
                </>
              )}
              
              {/* Scheduled Post Actions */}
              {post.status === 'SCHEDULED' && (
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/calendar')}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  View in Calendar
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Post Content */}
            <Card>
              <CardHeader>
                <CardTitle>Post Content</CardTitle>
                <CardDescription>Edit your post content and details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Media Upload */}
                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Images
                  </label>
                  <ImageUpload
                    onUpload={setMediaUrls}
                    maxFiles={5}
                    existingImages={mediaUrls}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Title (Optional)</label>
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    placeholder="Post title..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Content</label>
                  <textarea
                    className="w-full min-h-[300px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editedContent.length} characters, {editedContent.split(' ').length} words
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Scheduling */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Scheduling
                </CardTitle>
                <CardDescription>Choose when to publish this post</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Date</label>
                    <Input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Time</label>
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RSS Source Info - NEW */}
            {post.aiGenerated && (post.contentSourceId || post.rssItemTitle) && (
              <RSSSourceCard
                contentSourceId={post.contentSourceId}
                rssItemTitle={post.rssItemTitle}
                rssItemUrl={post.rssItemUrl}
                rssItemDate={post.rssItemDate}
                sourceName={post.contentSource?.name}
                sourceUrl={post.contentSource?.url}
              />
            )}

            {/* AI Metadata */}
            {post.aiGenerated && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">AI Generation Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Model:</span>
                      <span className="font-medium">{post.aiModel || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Confidence:</span>
                      <span className="font-medium">
                        {post.aiConfidence 
                          ? `${Math.round(post.aiConfidence * 100)}%`
                          : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">
                        {format(new Date(post.createdAt), 'PPp')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
    </>
  )
}
