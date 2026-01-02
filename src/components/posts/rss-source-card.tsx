'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Rss, Calendar, Newspaper } from 'lucide-react'
import { format } from 'date-fns'

interface RSSSourceCardProps {
  contentSourceId?: string | null
  rssItemTitle?: string | null
  rssItemUrl?: string | null
  rssItemDate?: string | null
  sourceName?: string
  sourceUrl?: string
}

export function RSSSourceCard({
  contentSourceId,
  rssItemTitle,
  rssItemUrl,
  rssItemDate,
  sourceName,
  sourceUrl
}: RSSSourceCardProps) {
  // If no RSS source data, don't render
  if (!contentSourceId && !rssItemTitle) {
    return null
  }

  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Rss className="h-4 w-4 text-purple-500" />
          Inspired by RSS Feed
          <Badge variant="outline" className="ml-auto">
            AI Generated
          </Badge>
        </CardTitle>
        <CardDescription>
          This post was generated using content from your RSS sources
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* RSS Item Title */}
        {rssItemTitle && (
          <div className="flex items-start gap-2">
            <Newspaper className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">Article Title:</div>
              <div className="text-sm font-medium">{rssItemTitle}</div>
            </div>
          </div>
        )}

        {/* RSS Source Name */}
        {sourceName && (
          <div className="flex items-start gap-2">
            <Rss className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">Source:</div>
              <div className="text-sm font-medium">{sourceName}</div>
              {sourceUrl && (
                <div className="text-xs text-muted-foreground truncate">{sourceUrl}</div>
              )}
            </div>
          </div>
        )}

        {/* Publication Date */}
        {rssItemDate && (
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">Published:</div>
              <div className="text-sm font-medium">
                {format(new Date(rssItemDate), 'PPp')}
              </div>
            </div>
          </div>
        )}

        {/* Link to Original Article */}
        {rssItemUrl && (
          <a
            href={rssItemUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline mt-3 pt-3 border-t"
          >
            <ExternalLink className="h-4 w-4" />
            View original article
          </a>
        )}

        {/* Info Box */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-3">
          <p className="text-xs text-purple-900">
            <strong>💡 How it works:</strong> AI analyzed this RSS article and used it as inspiration 
            to create original content that matches your brand voice and style. The content is unique 
            and tailored to your audience.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
