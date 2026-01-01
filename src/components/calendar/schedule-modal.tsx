'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Clock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date
  onScheduled: () => void
  postId?: string
}

interface Post {
  id: string
  title?: string
  content: string
  status: string
}

export function ScheduleModal({ isOpen, onClose, selectedDate, onScheduled, postId }: ScheduleModalProps) {
  const { toast } = useToast()
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedPost, setSelectedPost] = useState<string>(postId || '')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingPosts, setIsFetchingPosts] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchDraftPosts()
      
      // Set default date and time
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const timeStr = format(selectedDate, 'HH:mm')
      setScheduledDate(dateStr)
      setScheduledTime(timeStr)
    }
  }, [isOpen, selectedDate])

  const fetchDraftPosts = async () => {
    try {
      setIsFetchingPosts(true)
      const response = await fetch('/api/posts?status=DRAFT')
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setIsFetchingPosts(false)
    }
  }

  const handleSchedule = async () => {
    if (!selectedPost) {
      toast({
        title: 'Error',
        description: 'Please select a post to schedule',
        variant: 'destructive',
      })
      return
    }

    if (!scheduledDate || !scheduledTime) {
      toast({
        title: 'Error',
        description: 'Please select date and time',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`)
      
      const response = await fetch(`/api/posts/${selectedPost}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduledAt: scheduledAt.toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to schedule post')
      }

      toast({
        title: 'Success',
        description: `Post scheduled for ${format(scheduledAt, 'PPp')}`,
      })

      onScheduled()
      onClose()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to schedule post',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Schedule Post
              </CardTitle>
              <CardDescription>
                Select a draft post and choose when to publish it
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                <Calendar className="h-4 w-4 inline mr-2" />
                Date
              </label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                <Clock className="h-4 w-4 inline mr-2" />
                Time
              </label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>

          {/* Post Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Select Draft Post
            </label>
            
            {isFetchingPosts ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-2" />
                <p className="text-sm text-gray-600">Loading drafts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-gray-600 mb-2">No draft posts available</p>
                <p className="text-sm text-gray-500">Create a post first before scheduling</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-lg p-2">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPost === post.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPost(post.id)}
                  >
                    <h4 className="font-medium text-sm mb-1">
                      {post.title || 'Untitled Post'}
                    </h4>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {post.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSchedule}
              disabled={isLoading || !selectedPost}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                'Schedule Post'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
