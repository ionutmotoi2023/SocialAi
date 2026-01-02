'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Rss, Plus, Trash2, RefreshCw, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ContentSource {
  id: string
  name: string
  type: string
  url: string
  isActive: boolean
  lastChecked?: string
  settings?: {
    keywords?: string[]
    autoImport?: boolean
  }
}

export function ContentSourcesTab() {
  const { toast } = useToast()
  const [sources, setSources] = useState<ContentSource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [fetchingId, setFetchingId] = useState<string | null>(null)
  
  // Form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'rss',
    url: '',
    keywords: '',
  })

  useEffect(() => {
    loadSources()
  }, [])

  const loadSources = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/content-sources')
      if (response.ok) {
        const data = await response.json()
        setSources(data.sources || [])
      }
    } catch (error) {
      console.error('Failed to load sources:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSource = async () => {
    if (!formData.name || !formData.url) {
      toast({
        title: 'Missing fields',
        description: 'Name and URL are required',
        variant: 'destructive',
      })
      return
    }

    setIsAdding(true)
    try {
      const keywords = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0)

      const response = await fetch('/api/content-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          url: formData.url,
          isActive: true,
          settings: {
            keywords,
            autoImport: false,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add source')
      }

      toast({
        title: 'Success',
        description: 'Content source added successfully',
      })

      // Reset form
      setFormData({ name: '', type: 'rss', url: '', keywords: '' })
      setShowAddForm(false)
      
      // Reload sources
      await loadSources()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleFetchFeed = async (sourceId: string) => {
    setFetchingId(sourceId)
    try {
      const response = await fetch('/api/content-sources/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch feed')
      }

      const data = await response.json()
      
      toast({
        title: 'Feed fetched',
        description: data.message || `Fetched ${data.filteredItems} items`,
      })

      // Reload to update lastChecked
      await loadSources()
    } catch (error: any) {
      toast({
        title: 'Fetch failed',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setFetchingId(null)
    }
  }

  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm('Are you sure you want to delete this content source?')) {
      return
    }

    try {
      const response = await fetch(`/api/content-sources?id=${sourceId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete source')
      }

      toast({
        title: 'Success',
        description: 'Content source deleted',
      })

      // Reload sources
      await loadSources()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleToggleActive = async (source: ContentSource) => {
    try {
      const response = await fetch('/api/content-sources', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: source.id,
          isActive: !source.isActive,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update source')
      }

      // Reload sources
      await loadSources()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Add Source Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Rss className="h-5 w-5" />
                Content Sources & RSS Feeds
              </CardTitle>
              <CardDescription>
                Add RSS feeds and news sources for AI content inspiration
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Source
            </Button>
          </div>
        </CardHeader>
        
        {showAddForm && (
          <CardContent className="border-t">
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Source Name</label>
                  <Input
                    placeholder="e.g., TechCrunch AI"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Type</label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="rss">RSS Feed</option>
                    <option value="news">News Source</option>
                    <option value="website">Website</option>
                    <option value="competitor">Competitor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">URL</label>
                <Input
                  placeholder="https://example.com/feed.xml"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Keywords (comma-separated, optional)
                </label>
                <Input
                  placeholder="AI, automation, technology"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Only articles matching these keywords will be saved
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddSource} disabled={isAdding}>
                  {isAdding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Source'
                  )}
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Sources List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Content Sources</CardTitle>
          <CardDescription>
            Manage RSS feeds and content sources for AI inspiration
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="text-sm text-gray-500 mt-2">Loading sources...</p>
            </div>
          ) : sources.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                No content sources yet. Add your first RSS feed to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sources.map((source) => (
                <div key={source.id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{source.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {source.type}
                      </Badge>
                      <Badge variant={source.isActive ? 'default' : 'secondary'} className="text-xs">
                        {source.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{source.url}</p>
                    {source.settings?.keywords && source.settings.keywords.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {source.settings.keywords.map((keyword, idx) => (
                          <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                    {source.lastChecked && (
                      <p className="text-xs text-gray-400 mt-1">
                        Last checked: {new Date(source.lastChecked).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(source)}
                    >
                      {source.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    {source.type === 'rss' && (
                      <Button
                        size="sm"
                        onClick={() => handleFetchFeed(source.id)}
                        disabled={fetchingId === source.id}
                      >
                        {fetchingId === source.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Fetch
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteSource(source.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 space-y-1">
              <p className="font-semibold">How Content Sources Work</p>
              <ul className="space-y-1 text-blue-800 list-disc list-inside">
                <li>Add RSS feeds from industry blogs, news sites, or competitors</li>
                <li>Use keywords to filter relevant articles automatically</li>
                <li>Click "Fetch" to import latest articles for AI inspiration</li>
                <li>AI uses these articles as inspiration for trending content</li>
                <li>Content is original - AI doesn't copy, just gets ideas</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ContentSourcesTab
