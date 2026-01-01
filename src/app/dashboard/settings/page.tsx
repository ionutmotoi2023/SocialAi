'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Bot, Save, Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function SettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [config, setConfig] = useState({
    selectedModel: 'gpt-4-turbo',
    brandVoice: '',
    tonePreference: 'professional',
    postLength: 'medium',
    hashtagStrategy: 'moderate',
    includeEmojis: true,
    includeCTA: true,
  })

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/settings/ai-config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      }
    } catch (error) {
      console.error('Failed to fetch config:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/settings/ai-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-600">Configure your AI and platform preferences</p>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Tenant Info */}
            <Card>
              <CardHeader>
                <CardTitle>Workspace Information</CardTitle>
                <CardDescription>Your current workspace details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Workspace Name
                  </label>
                  <Input
                    value={session?.user.tenant.name || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Your Role
                  </label>
                  <Badge variant="secondary">
                    {session?.user.role.replace('_', ' ')}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* AI Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="h-5 w-5 mr-2 text-blue-600" />
                  AI Configuration
                </CardTitle>
                <CardDescription>
                  Customize how AI generates content for your brand
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* AI Model */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    AI Model
                  </label>
                  <select
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={config.selectedModel}
                    onChange={(e) => setConfig({ ...config, selectedModel: e.target.value })}
                  >
                    <option value="gpt-4-turbo">GPT-4 Turbo (Recommended)</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Faster)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    GPT-4 Turbo provides the best quality content generation
                  </p>
                </div>

                {/* Brand Voice */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Brand Voice
                  </label>
                  <textarea
                    className="w-full min-h-[100px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your brand's unique voice and personality... e.g., 'Professional yet approachable, innovative and forward-thinking, with a focus on customer success'"
                    value={config.brandVoice}
                    onChange={(e) => setConfig({ ...config, brandVoice: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This helps AI understand and match your brand's communication style
                  </p>
                </div>

                {/* Tone Preference */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Tone Preference
                  </label>
                  <select
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={config.tonePreference}
                    onChange={(e) => setConfig({ ...config, tonePreference: e.target.value })}
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="enthusiastic">Enthusiastic</option>
                    <option value="technical">Technical</option>
                  </select>
                </div>

                {/* Post Length */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Default Post Length
                  </label>
                  <select
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={config.postLength}
                    onChange={(e) => setConfig({ ...config, postLength: e.target.value })}
                  >
                    <option value="short">Short (100-150 words)</option>
                    <option value="medium">Medium (150-250 words)</option>
                    <option value="long">Long (250-400 words)</option>
                  </select>
                </div>

                {/* Hashtag Strategy */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Hashtag Strategy
                  </label>
                  <select
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={config.hashtagStrategy}
                    onChange={(e) => setConfig({ ...config, hashtagStrategy: e.target.value })}
                  >
                    <option value="minimal">Minimal (1-2 hashtags)</option>
                    <option value="moderate">Moderate (3-5 hashtags)</option>
                    <option value="extensive">Extensive (6-8 hashtags)</option>
                  </select>
                </div>

                {/* Toggles */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Include Emojis</p>
                      <p className="text-xs text-gray-500">Add relevant emojis to posts</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={config.includeEmojis}
                        onChange={(e) => setConfig({ ...config, includeEmojis: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Include Call-to-Action</p>
                      <p className="text-xs text-gray-500">Add CTAs to encourage engagement</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={config.includeCTA}
                        onChange={(e) => setConfig({ ...config, includeCTA: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Learning */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
                  AI Learning
                </CardTitle>
                <CardDescription>
                  Your AI continuously learns from your feedback and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Posts Analyzed</span>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Patterns Learned</span>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Accuracy Improvement</span>
                    <span className="font-semibold text-green-600">+0%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
