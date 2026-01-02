'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Globe, Loader2, CheckCircle, AlertCircle, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface BrandData {
  [category: string]: Array<{
    id: string
    sourceUrl: string
    content: string
    lastUpdated: string
  }>
}

export function BrandTrainingTab() {
  const { toast } = useToast()
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [isScaping, setIsScraping] = useState(false)
  const [scrapeResult, setScrapeResult] = useState<any>(null)
  const [brandData, setBrandData] = useState<BrandData>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleScrape = async () => {
    if (!websiteUrl) {
      toast({
        title: 'Missing URL',
        description: 'Please enter a website URL',
        variant: 'destructive',
      })
      return
    }

    setIsScraping(true)
    setScrapeResult(null)

    try {
      const response = await fetch('/api/brand/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteUrl }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to scrape website')
      }

      const data = await response.json()
      setScrapeResult(data)

      toast({
        title: 'Success',
        description: data.message || 'Website scraped successfully',
      })

      // Reload brand data
      await loadBrandData()
    } catch (error: any) {
      toast({
        title: 'Scraping failed',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsScraping(false)
    }
  }

  const loadBrandData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/brand/scrape')
      if (response.ok) {
        const result = await response.json()
        setBrandData(result.data || {})
      }
    } catch (error) {
      console.error('Failed to load brand data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all brand training data?')) {
      return
    }

    try {
      const response = await fetch('/api/brand/scrape', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to clear data')
      }

      setBrandData({})
      setScrapeResult(null)

      toast({
        title: 'Success',
        description: 'Brand training data cleared',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  React.useEffect(() => {
    loadBrandData()
  }, [])

  return (
    <div className="space-y-6">
      {/* Scrape Website Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Website Scraping for Brand Training
          </CardTitle>
          <CardDescription>
            Extract brand information from your company website to train AI on your brand voice and values
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              disabled={isScaping}
            />
            <Button onClick={handleScrape} disabled={isScaping}>
              {isScaping ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <Globe className="mr-2 h-4 w-4" />
                  Scrape Website
                </>
              )}
            </Button>
          </div>

          {scrapeResult && (
            <div className="border rounded-lg p-4 bg-green-50 space-y-2">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Scraping Complete!</span>
              </div>
              <p className="text-sm text-gray-700">
                Scraped {scrapeResult.scraped} sections from the website
              </p>
              {scrapeResult.sections && (
                <div className="mt-2 space-y-1">
                  {scrapeResult.sections.map((section: any, idx: number) => (
                    <div key={idx} className="text-xs bg-white p-2 rounded border">
                      <span className="font-medium text-blue-600">{section.category}:</span>{' '}
                      <span className="text-gray-600">{section.preview}</span>
                    </div>
                  ))}
                </div>
              )}
              {scrapeResult.styleAnalysis && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded border">
                    <span className="text-gray-500">Tone:</span>{' '}
                    <Badge variant="secondary">{scrapeResult.styleAnalysis.dominantTone}</Badge>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <span className="text-gray-500">Readability:</span>{' '}
                    <Badge variant="secondary">{scrapeResult.styleAnalysis.readabilityScore}</Badge>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stored Brand Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Stored Brand Knowledge</CardTitle>
              <CardDescription>
                AI will use this information when generating content
              </CardDescription>
            </div>
            {Object.keys(brandData).length > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="text-sm text-gray-500 mt-2">Loading brand data...</p>
            </div>
          ) : Object.keys(brandData).length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                No brand data yet. Scrape your website to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(brandData).map(([category, items]) => (
                <div key={category} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="font-medium">
                      {category}
                    </Badge>
                    <span className="text-xs text-gray-500">{items.length} sections</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {item.content.substring(0, 150)}...
                        <div className="text-xs text-gray-400 mt-1">
                          Updated: {new Date(item.lastUpdated).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
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
              <p className="font-semibold">How Brand Training Works</p>
              <ul className="space-y-1 text-blue-800 list-disc list-inside">
                <li>Enter your company website URL and click "Scrape Website"</li>
                <li>AI extracts key information: About, Products, Services, Values</li>
                <li>Content is analyzed for tone and writing style</li>
                <li>AI uses this knowledge to generate brand-aligned content</li>
                <li>Update anytime to keep AI in sync with your brand</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Export for use in Settings page
export default BrandTrainingTab
