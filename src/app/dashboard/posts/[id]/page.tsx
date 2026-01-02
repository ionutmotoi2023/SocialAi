'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { RSSSourceCard } from '@/components/posts/rss-source-card'
import { ArrowLeft, Home, Save, Trash2, Calendar, Send, Loader2, Image as ImageIcon, Linkedin } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ImageUpload } from '@/components/upload/image-upload'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

interface LinkedInIntegration {
  id: string
  linkedinId: string
  profileName?: string
  profileImage?: string
  profileType: 'PERSONAL' | 'COMPANY_PAGE'
  organizationName?: string
  organizationId?: string
  isActive: boolean
  expiresAt?: string
  createdAt: string
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
  
  // LinkedIn integrations
  const [linkedInIntegrations, setLinkedInIntegrations] = useState<LinkedInIntegration[]>([])
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string>('')

  useEffect(() => {
    fetchPost()
    fetchLinkedInIntegrations()
  }, [params.id])

  const fetchLinkedInIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations/linkedin')
      if (response.ok) {
        const data = await response.json()
        const integrations = data.integrations || []
        setLinkedInIntegrations(integrations)
        // Auto-select first active integration
        if (integrations.length > 0 && !selectedIntegrationId) {
          setSelectedIntegrationId(integrations[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch LinkedIn integrations:', error)
    }
  }

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
    // ✅ Check if integration is selected
    if (!selectedIntegrationId) {
      toast({
        title: '🔗 No LinkedIn account connected',
        description: 'Please go to Settings → Integrations and connect your LinkedIn account first, then refresh this page.',
        variant: 'destructive',
      })
      return
    }

    // ✅ Additional check if integrations list is empty
    if (linkedInIntegrations.length === 0) {
      toast({
        title: '🔗 LinkedIn not connected',
        description: 'You need to connect at least one LinkedIn account. Go to Settings → Integrations → Connect LinkedIn.',
        variant: 'destructive',
      })
      return
    }

    const selectedIntegration = linkedInIntegrations.find(i => i.id === selectedIntegrationId)
    const destinationName = selectedIntegration?.profileType === 'COMPANY_PAGE' 
      ? selectedIntegration.organizationName 
      : selectedIntegration?.profileName

    // ✅ Combined logic: Check if SCHEDULED + destination name
    const confirmMessage = post?.status === 'SCHEDULED'
      ? `This post is scheduled for later. Publish it to ${destinationName} now instead?`
      : `Publish this post to ${destinationName} now?`
    
    if (!confirm(confirmMessage)) {
      return
    }

    setIsPublishing(true)

    try {
      // First, save any changes and clear scheduling if post was SCHEDULED
      if (post?.status === 'SCHEDULED') {
        // Clear scheduled time to prevent duplicate publishing by cron
        const response = await fetch(`/api/posts/${params.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: editedTitle,
            content: editedContent,
            mediaUrls,
            scheduledAt: null, // ✅ Clear scheduled time
            status: 'APPROVED', // Move to APPROVED before publishing
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to update post status')
        }
      } else {
        // For non-scheduled posts, just save changes
        await handleSave()
      }

      // Then publish with selected integration
      const response = await fetch(`/api/posts/${params.id}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linkedInIntegrationId: selectedIntegrationId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to publish post')
      }

      toast({
        title: 'Success',
        description: `Post published to ${destinationName} successfully`,
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
        setIsScheduling(false) // ✅ Reset loading state
        toast({
          title: '📅 Schedule date/time missing',
          description: 'Please scroll down and select both date and time in the "Scheduling" section before clicking Reschedule.',
          variant: 'destructive',
        })
        return
      }

      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`)
      
      // Check if date is in the future
      if (scheduledAt <= new Date()) {
        setIsScheduling(false) // ✅ Reset loading state
        toast({
          title: '⏰ Invalid schedule time',
          description: 'Please select a future date and time. The scheduled time must be after the current time.',
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
      PENDING_APPROVAL: { color: 'bg-yellow-500', label: 'Pending Approval' },
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
              
              {/* Show Publish/Schedule buttons for posts that are not yet published */}
              {(post.status === 'DRAFT' || 
                post.status === 'APPROVED' || 
                post.status === 'PENDING_APPROVAL' ||
                post.status === 'SCHEDULED') && (
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
                        {post.status === 'SCHEDULED' ? 'Reschedule' : 'Schedule'}
                      </>
                    )}
                  </Button>
                  
                  {/* LinkedIn Destination Selector */}
                  {linkedInIntegrations.length > 0 ? (
                    <Select
                      value={selectedIntegrationId}
                      onValueChange={setSelectedIntegrationId}
                    >
                      <SelectTrigger className="w-[240px]">
                        <SelectValue placeholder="Select destination..." />
                      </SelectTrigger>
                      <SelectContent>
                        {linkedInIntegrations.map((integration) => (
                          <SelectItem key={integration.id} value={integration.id}>
                            <div className="flex items-center gap-2">
                              <Linkedin className="h-4 w-4" />
                              <span>
                                {integration.profileType === 'COMPANY_PAGE'
                                  ? integration.organizationName
                                  : integration.profileName}
                              </span>
                              <Badge 
                                className={`text-xs ${
                                  integration.profileType === 'COMPANY_PAGE'
                                    ? 'bg-purple-500'
                                    : 'bg-blue-500'
                                }`}
                              >
                                {integration.profileType === 'COMPANY_PAGE' ? 'Company' : 'Personal'}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      ⚠️ No LinkedIn connected
                    </Badge>
                  )}
                  
                  <Button
                    onClick={handlePublishNow}
                    disabled={isPublishing || isSaving || linkedInIntegrations.length === 0}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    title={linkedInIntegrations.length === 0 ? '⚠️ Connect LinkedIn in Settings → Integrations first' : ''}
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        {post.status === 'SCHEDULED' ? 'Publish Now Instead' : 'Publish Now'}
                      </>
                    )}
                  </Button>
                </>
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
