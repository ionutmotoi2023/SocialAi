'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, TrendingUp, TrendingDown, Rss, Edit, Lightbulb, BarChart3 } from 'lucide-react'

interface AIInsightsData {
  overview: {
    totalEdits: number
    aiAccuracy: number
    totalInspirations: number
    postsFromRSS: number
    accuracyTrend: number
  }
  rssSourcesPerformance: Array<{
    id: string
    name: string
    url: string
    postsGenerated: number
    accuracy: number
  }>
  recentLearnings: Array<{
    id: string
    date: string
    type: string
    originalPreview: string
    modifiedPreview: string
    feedback: string | null
    postId: string | null
  }>
  editPatterns: {
    totalEdits: number
    avgEditLength: number
    commonChanges: string[]
  }
  insights: string[]
}

interface AIInsightsSectionProps {
  timeRange?: string
}

export function AIInsightsSection({ timeRange = '30d' }: AIInsightsSectionProps) {
  const [data, setData] = useState<AIInsightsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInsights()
  }, [timeRange])

  const fetchInsights = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/ai/insights?range=${timeRange}`)
      if (response.ok) {
        const insightsData = await response.json()
        setData(insightsData)
      }
    } catch (error) {
      console.error('Failed to fetch AI insights:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading AI insights...
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return null
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-green-600'
    if (accuracy >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI Learning & Performance Insights
          </CardTitle>
          <CardDescription>
            Track how AI is learning from your edits and RSS sources
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Total Edits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.overview.totalEdits}</div>
            <p className="text-xs text-muted-foreground mt-1">
              User modifications tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              AI Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getAccuracyColor(data.overview.aiAccuracy)}`}>
              {data.overview.aiAccuracy.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 mt-1">
              {getTrendIcon(data.overview.accuracyTrend)}
              <span className="text-xs text-muted-foreground">
                {data.overview.accuracyTrend > 0 ? '+' : ''}
                {data.overview.accuracyTrend}% vs last week
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Rss className="h-4 w-4" />
              RSS Inspirations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.overview.totalInspirations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.overview.postsFromRSS} posts generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Insights Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.insights.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Learning patterns detected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* RSS Sources Performance */}
      {data.rssSourcesPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rss className="h-5 w-5" />
              RSS Sources Performance
            </CardTitle>
            <CardDescription>
              How each content source contributes to your posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.rssSourcesPerformance.map((source) => (
                <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="font-medium">{source.name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-md">
                      {source.url}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">{source.postsGenerated} posts</div>
                      <div className={`text-xs ${getAccuracyColor(source.accuracy)}`}>
                        {source.accuracy}% accuracy
                      </div>
                    </div>
                    <Badge variant={source.accuracy >= 90 ? 'default' : 'secondary'}>
                      {source.accuracy >= 90 ? '✅ Excellent' : source.accuracy >= 75 ? '👍 Good' : '⚠️ Needs Review'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Insights */}
      {data.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Key Learning Insights
            </CardTitle>
            <CardDescription>
              Patterns detected from your editing behavior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                  <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Learnings */}
      {data.recentLearnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Recent Learning Activity
            </CardTitle>
            <CardDescription>
              Latest edits and modifications tracked for AI improvement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentLearnings.slice(0, 5).map((learning) => (
                <div key={learning.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(learning.date).toLocaleDateString()}</span>
                    <Badge variant="outline">{learning.type}</Badge>
                  </div>
                  {learning.originalPreview && learning.modifiedPreview && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="font-medium text-muted-foreground mb-1">Original:</div>
                        <div className="text-gray-600 line-clamp-2">{learning.originalPreview}...</div>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground mb-1">Modified:</div>
                        <div className="text-gray-600 line-clamp-2">{learning.modifiedPreview}...</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
