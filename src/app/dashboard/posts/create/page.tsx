'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Bot, Loader2, Sparkles, RefreshCw, Save, Send, Image as ImageIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ImageUpload } from '@/components/upload/image-upload'

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
          title: prompt.substring(0, 100),
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
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Post</h1>
              <p className="text-sm text-gray-600">Generate AI-powered content for your social media</p>
            </div>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Input Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="h-5 w-5 mr-2 text-blue-600" />
                  AI Content Generator
                </CardTitle>
                <CardDescription>
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
                </div>

                <div>
                  <label htmlFor="prompt" className="text-sm font-medium mb-2 block">
                    What would you like to post about?
                  </label>
                  <textarea
                    id="prompt"
                    className="w-full min-h-[120px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Example: Write a post about the benefits of AI automation in social media marketing..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="flex-1"
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
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Generated Content</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          Confidence: {Math.round(generatedContent.confidence * 100)}%
                        </Badge>
                        <Badge variant="secondary">
                          {generatedContent.model}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>
                      Review and edit the generated content before publishing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <textarea
                        className="w-full min-h-[200px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                      />
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                        {editedContent}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        {isEditing ? 'Preview' : 'Edit'}
                      </Button>
                      <Button variant="outline" onClick={handleSaveDraft}>
                        <Save className="mr-2 h-4 w-4" />
                        Save as Draft
                      </Button>
                      <Button className="ml-auto">
                        <Send className="mr-2 h-4 w-4" />
                        Schedule Post
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">AI Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Generation Time:</span>
                        <span className="font-medium">
                          {(generatedContent.generationTime / 1000).toFixed(2)}s
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Hashtags:</span>
                        <span className="font-medium">{generatedContent.hashtags.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Word Count:</span>
                        <span className="font-medium">
                          {generatedContent.text.split(' ').length} words
                        </span>
                      </div>
                    </div>

                    {generatedContent.suggestions && generatedContent.suggestions.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium mb-2">Suggestions:</p>
                        <ul className="space-y-1">
                          {generatedContent.suggestions.map((suggestion: string, index: number) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="mr-2">•</span>
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
      </div>
    </div>
  )
}
