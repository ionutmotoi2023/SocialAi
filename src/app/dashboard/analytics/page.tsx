'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AIInsightsSection } from '@/components/analytics/ai-insights-section'
import { 
  TrendingUp, TrendingDown, Activity, Clock, Target, Zap,
  ThumbsUp, MessageCircle, Share2, Eye
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalPosts: number
    published: number
    avgEngagement: number
    timeSaved: number
    aiAccuracy: number
  }
  performance: {
    topPost: {
      id: string
      content: string
      engagement: number
      publishedAt: string
    } | null
    recentPosts: Array<{
      id: string
      content: string
      status: string
      engagement: number
      aiGenerated: boolean
      publishedAt: string | null
    }>
  }
  trends: {
    postsThisWeek: number
    postsLastWeek: number
    engagementGrowth: number
  }
}

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics?range=${timeRange}`)
      if (response.ok) {
        const analyticsData = await response.json()
        setData(analyticsData)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12 text-muted-foreground">
          Loading analytics...
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No data available</h3>
            <p className="text-muted-foreground">
              Start creating posts to see your analytics
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getTrendIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (growth < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Activity className="h-4 w-4 text-gray-500" />
  }

  const getTrendColor = (growth: number) => {
    if (growth > 0) return 'text-green-500'
    if (growth < 0) return 'text-red-500'
    return 'text-gray-500'
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track your content performance and AI insights
          </p>
        </div>

        {/* Time Range Selector */}
        <select
          className="h-10 px-4 border border-input bg-background rounded-md"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.overview.totalPosts}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {data.overview.published} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data.overview.avgEngagement.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 mt-1">
              {getTrendIcon(data.trends.engagementGrowth)}
              <span className={`text-sm ${getTrendColor(data.trends.engagementGrowth)}`}>
                {data.trends.engagementGrowth > 0 ? '+' : ''}
                {data.trends.engagementGrowth.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Saved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.overview.timeSaved}h</div>
            <p className="text-sm text-muted-foreground mt-1">
              Using AI generation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              AI Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data.overview.aiAccuracy.toFixed(0)}%
            </div>
            <p className="text-sm text-green-500 mt-1">
              High confidence
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.trends.postsThisWeek}</div>
            <p className="text-sm text-muted-foreground mt-1">
              vs {data.trends.postsLastWeek} last week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Post */}
      {data.performance.topPost && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Top Performing Post
            </CardTitle>
            <CardDescription>
              Your best post in the selected time range
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-lg">{data.performance.topPost.content.substring(0, 200)}...</p>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="gap-1">
                  <ThumbsUp className="h-3 w-3" />
                  {data.performance.topPost.engagement} engagement
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Published {new Date(data.performance.topPost.publishedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Posts Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts Performance</CardTitle>
          <CardDescription>
            Track engagement and performance of your recent posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.performance.recentPosts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No posts to display
              </p>
            ) : (
              data.performance.recentPosts.map((post) => (
                <div key={post.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <p className="flex-1">
                      {post.content.substring(0, 150)}
                      {post.content.length > 150 && '...'}
                    </p>
                    <Badge variant={post.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                      {post.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    {post.aiGenerated && (
                      <Badge variant="outline" className="gap-1">
                        <Zap className="h-3 w-3" />
                        AI Generated
                      </Badge>
                    )}
                    
                    {post.publishedAt && (
                      <>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Eye className="h-4 w-4" />
                          {post.engagement || 0} views
                        </div>
                        <span className="text-muted-foreground">
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            AI Performance Insights
          </CardTitle>
          <CardDescription>
            How AI is helping you create better content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-4xl font-bold text-primary mb-2">
                {data.overview.aiAccuracy.toFixed(0)}%
              </div>
              <p className="text-sm text-muted-foreground">AI Confidence Score</p>
              <p className="text-xs text-muted-foreground mt-2">
                Average confidence in AI-generated content
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-4xl font-bold text-green-500 mb-2">
                {data.overview.timeSaved}h
              </div>
              <p className="text-sm text-muted-foreground">Time Saved</p>
              <p className="text-xs text-muted-foreground mt-2">
                Estimated time saved using AI
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-4xl font-bold text-blue-500 mb-2">
                {Math.round((data.overview.published / data.overview.totalPosts) * 100)}%
              </div>
              <p className="text-sm text-muted-foreground">Publish Rate</p>
              <p className="text-xs text-muted-foreground mt-2">
                Posts published vs created
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Learning Insights Section - NEW */}
      <AIInsightsSection timeRange={timeRange} />
    </div>
  )
}
