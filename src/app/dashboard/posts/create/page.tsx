'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Bot, Loader2, Sparkles, RefreshCw, Save, Send, Image as ImageIcon, Home, Eye } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ImageUpload } from '@/components/upload/image-upload'
import { LinkedInPostPreview } from '@/components/posts/linkedin-post-preview'

export default function CreatePostPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [generatedContent, setGeneratedContent] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [optimizedMediaUrls, setOptimizedMediaUrls] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(true) // Show preview by default

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a prompt first',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          mediaUrls: optimizedMediaUrls.length > 0 ? optimizedMediaUrls : mediaUrls, // Use optimized URLs for GPT-4
          includeHashtags: true,
          includeCTA: true,
          saveAsDraft: false,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate content')
      }

      setGeneratedContent(data.content)
      setEditedContent(data.content.text)
      setIsEditing(false)

      toast({
        title: 'Success',
        description: `Content generated in ${(data.content.generationTime / 1000).toFixed(2)}s`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate content',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveDraft = async () => {
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editedContent,
          title: generatedContent?.title || prompt.substring(0, 100), // ✅ Use AI-generated title
          status: 'DRAFT',
          mediaUrls,
          aiGenerated: true,
          aiModel: generatedContent?.model,
          aiConfidence: generatedContent?.confidence,
          originalPrompt: prompt,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save draft')
      }

      toast({
        title: 'Success',
        description: 'Draft saved successfully',
      })

      router.push('/dashboard/posts')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save draft',
        variant: 'destructive',
      })
    }
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Create Post</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 hidden sm:block">
                Generate AI-powered content for your social media
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {/* Mobile Home Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/dashboard')}
                className="lg:hidden shrink-0"
                title="Go to Home"
              >
                <Home className="h-5 w-5" />
              </Button>
              {/* Desktop Back Button */}
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="hidden lg:flex shrink-0"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
            {/* Input Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Bot className="h-5 w-5 mr-2 text-blue-600" />
                  AI Content Generator
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Describe what you want to post about, and our AI will create engaging content for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Media Upload */}
                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Upload Images (Optional)
                  </label>
                  <ImageUpload
                    onUpload={(urls, optimizedUrls) => {
                      setMediaUrls(urls)
                      if (optimizedUrls) {
                        setOptimizedMediaUrls(optimizedUrls)
                      }
                    }}
                    maxFiles={5}
                    existingImages={mediaUrls}
                  />
                  {mediaUrls.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      {mediaUrls.length} image{mediaUrls.length > 1 ? 's' : ''} uploaded
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="prompt" className="text-sm font-medium mb-2 block">
                    What would you like to post about?
                  </label>
                  <textarea
                    id="prompt"
                    className="w-full min-h-[120px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    placeholder="Example: Write a funny post about the benefits of AI automation in social media marketing..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Be specific about the tone and style you want
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="flex-1 sm:flex-initial"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Content
                      </>
                    )}
                  </Button>

                  {generatedContent && (
                    <Button
                      variant="outline"
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="flex-1 sm:flex-initial"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Generated Content Card */}
            {generatedContent && (
              <>
                {/* Toggle between Edit and Preview */}
                <div className="flex items-center justify-center gap-2 my-4">
                  <Button
                    variant={!showPreview ? 'default' : 'outline'}
                    onClick={() => setShowPreview(false)}
                    className="flex-1 sm:flex-initial"
                  >
                    Edit Content
                  </Button>
                  <Button
                    variant={showPreview ? 'default' : 'outline'}
                    onClick={() => setShowPreview(true)}
                    className="flex-1 sm:flex-initial"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview Post
                  </Button>
                </div>

                {/* Edit View */}
                {!showPreview && (
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <CardTitle>Edit Content</CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            Confidence: {Math.round(generatedContent.confidence * 100)}%
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {generatedContent.model}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription>
                        Make any changes to the generated content
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <textarea
                        className="w-full min-h-[250px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        placeholder="Edit your post content here..."
                      />

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button 
                          variant="outline" 
                          onClick={handleSaveDraft}
                          className="w-full sm:w-auto"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Save as Draft
                        </Button>
                        <Button 
                          className="w-full sm:w-auto sm:ml-auto"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Schedule Post
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* LinkedIn Preview */}
                {showPreview && (
                  <div className="space-y-4">
                    <Card className="p-4">
                      <h3 className="text-lg font-semibold mb-2">LinkedIn Preview</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        This is how your post will appear on LinkedIn
                      </p>
                      <LinkedInPostPreview 
                        content={editedContent} 
                        mediaUrls={mediaUrls}
                      />
                    </Card>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        variant="outline" 
                        onClick={handleSaveDraft}
                        className="w-full sm:w-auto"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save as Draft
                      </Button>
                      <Button 
                        className="w-full sm:w-auto sm:ml-auto"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Schedule Post
                      </Button>
                    </div>
                  </div>
                )}

                {/* AI Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm sm:text-base">AI Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className="flex items-center justify-between sm:flex-col sm:items-start text-sm p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-medium">Generation Time</span>
                        <span className="font-semibold text-blue-600">
                          {(generatedContent.generationTime / 1000).toFixed(2)}s
                        </span>
                      </div>
                      <div className="flex items-center justify-between sm:flex-col sm:items-start text-sm p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-medium">Hashtags</span>
                        <span className="font-semibold text-blue-600">{generatedContent.hashtags.length}</span>
                      </div>
                      <div className="flex items-center justify-between sm:flex-col sm:items-start text-sm p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-medium">Word Count</span>
                        <span className="font-semibold text-blue-600">
                          {generatedContent.text.split(' ').length} words
                        </span>
                      </div>
                    </div>

                    {generatedContent.suggestions && generatedContent.suggestions.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium mb-2">💡 Suggestions:</p>
                        <ul className="space-y-2">
                          {generatedContent.suggestions.map((suggestion: string, index: number) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start bg-blue-50 p-2 rounded">
                              <span className="mr-2 text-blue-600">•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </main>
    </>
  )
}
