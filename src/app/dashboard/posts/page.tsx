'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Calendar, CheckCircle, Clock, Plus, Filter, ThumbsUp, ThumbsDown, Send, Edit } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

interface Post {
  id: string
  title?: string
  content: string
  status: string
  platform: string
  aiGenerated: boolean
  aiConfidence?: number
  createdAt: string
  scheduledAt?: string
  publishedAt?: string
  user: {
    id: string
    name?: string
    email: string
  }
}

export default function PostsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [processingPost, setProcessingPost] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [filterStatus])

  const fetchPosts = async () => {
    try {
      const url = filterStatus === 'all' 
        ? '/api/posts' 
        : `/api/posts?status=${filterStatus}`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (postId: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent card click navigation
    setProcessingPost(postId)
    
    try {
      const response = await fetch(`/api/posts/${postId}/approve`, {
        method: 'POST',
      })

      if (response.ok) {
        toast({
          title: 'Post approved',
          description: 'The post has been approved and is ready for scheduling',
        })
        fetchPosts() // Refresh list
      } else {
        const error = await response.json()
        toast({
          title: 'Approval failed',
          description: error.error || 'Failed to approve post',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Approval failed',
        description: 'An error occurred while approving the post',
        variant: 'destructive',
      })
    } finally {
      setProcessingPost(null)
    }
  }

  const handleReject = async (postId: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent card click navigation
    setProcessingPost(postId)
    
    try {
      const response = await fetch(`/api/posts/${postId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Rejected by admin' }),
      })

      if (response.ok) {
        toast({
          title: 'Post rejected',
          description: 'The post has been moved to drafts for editing',
        })
        fetchPosts() // Refresh list
      } else {
        const error = await response.json()
        toast({
          title: 'Rejection failed',
          description: error.error || 'Failed to reject post',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Rejection failed',
        description: 'An error occurred while rejecting the post',
        variant: 'destructive',
      })
    } finally {
      setProcessingPost(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; color: string }> = {
      DRAFT: { variant: 'secondary', color: 'text-gray-600' },
      PENDING_APPROVAL: { variant: 'default', color: 'text-yellow-600' },
      APPROVED: { variant: 'default', color: 'text-green-600' },
      SCHEDULED: { variant: 'default', color: 'text-blue-600' },
      PUBLISHED: { variant: 'default', color: 'text-green-600' },
      FAILED: { variant: 'destructive', color: 'text-red-600' },
    }

    const config = variants[status] || variants.DRAFT

    return (
      <Badge variant={config.variant} className={config.color}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'SCHEDULED':
        return <Calendar className="h-5 w-5 text-blue-600" />
      case 'DRAFT':
        return <FileText className="h-5 w-5 text-gray-600" />
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />
    }
  }

  const statusFilters = [
    { label: 'All Posts', value: 'all' },
    { label: 'Pending Approval', value: 'PENDING_APPROVAL' }, // ✅ NEW: Filter for pending posts
    { label: 'Drafts', value: 'DRAFT' },
    { label: 'Scheduled', value: 'SCHEDULED' },
    { label: 'Published', value: 'PUBLISHED' },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading posts...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Posts</h1>
              <p className="text-xs sm:text-sm text-gray-600">Manage your social media content</p>
            </div>
            <Button onClick={() => router.push('/dashboard/posts/create')} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create Post
            </Button>
          </div>
        </header>

        {/* Filters - Mobile scrollable */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="h-4 w-4 text-gray-600 flex-shrink-0" />
            <div className="flex gap-2 pb-1">
              {statusFilters.map((filter) => (
                <Button
                  key={filter.value}
                  variant={filterStatus === filter.value ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterStatus(filter.value)}
                  className="whitespace-nowrap flex-shrink-0"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-6xl mx-auto">
            {posts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <FileText className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No posts yet
                  </h3>
                  <p className="text-gray-600 mb-6 text-center max-w-md">
                    Get started by creating your first AI-powered social media post
                  </p>
                  <Button onClick={() => router.push('/dashboard/posts/create')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Post
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {posts.map((post) => (
                  <Card
                    key={post.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/dashboard/posts/${post.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getStatusIcon(post.status)}
                          <div>
                            <CardTitle className="text-lg">
                              {post.title || 'Untitled Post'}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              <span>by {post.user.name || post.user.email}</span>
                              <span>•</span>
                              <span>
                                {formatDistanceToNow(new Date(post.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {post.aiGenerated && (
                            <Badge variant="secondary">
                              AI {post.aiConfidence ? `${Math.round(post.aiConfidence * 100)}%` : ''}
                            </Badge>
                          )}
                          {getStatusBadge(post.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 line-clamp-3">{post.content}</p>
                      {post.scheduledAt && (
                        <div className="mt-4 flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          Scheduled for{' '}
                          {new Date(post.scheduledAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      )}
                      
                      {/* ✅ Approve/Reject buttons for PENDING_APPROVAL posts */}
                      {post.status === 'PENDING_APPROVAL' && (
                        <div className="mt-4 flex flex-col sm:flex-row gap-2 border-t pt-4">
                          <Button
                            size="sm"
                            variant="default"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={(e) => handleApprove(post.id, e)}
                            disabled={processingPost === post.id}
                          >
                            <ThumbsUp className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={(e) => handleReject(post.id, e)}
                            disabled={processingPost === post.id}
                          >
                            <ThumbsDown className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}

                      {/* ✅ NEW: Edit/Publish buttons for DRAFT and APPROVED posts */}
                      {(post.status === 'DRAFT' || post.status === 'APPROVED') && (
                        <div className="mt-4 flex flex-col sm:flex-row gap-2 border-t pt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/dashboard/posts/${post.id}`)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit & Publish
                          </Button>
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
