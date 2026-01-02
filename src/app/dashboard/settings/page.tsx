'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Bot, Save, Sparkles, Globe, Rss, Image as ImageIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { BrandTrainingTab } from '@/components/settings/brand-training-tab'
import { ContentSourcesTab } from '@/components/settings/content-sources-tab'
import { BrandAssetsTab } from '@/components/settings/brand-assets-tab'
import BrandVariablesTab from '@/components/settings/brand-variables-tab'

type TabType = 'ai' | 'variables' | 'brand' | 'content' | 'assets'

export default function SettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<TabType>('ai')
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
    if (activeTab === 'ai') {
      fetchConfig()
    }
  }, [activeTab])

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
        {/* Tabs Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-6">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('ai')}
                className={`py-4 px-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'ai'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Bot className="h-4 w-4 inline mr-2" />
                AI Settings
              </button>
              <button
                onClick={() => setActiveTab('variables')}
                className={`py-4 px-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'variables'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Sparkles className="h-4 w-4 inline mr-2" />
                Brand Variables
              </button>
              <button
                onClick={() => setActiveTab('brand')}
                className={`py-4 px-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'brand'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Globe className="h-4 w-4 inline mr-2" />
                Brand Training
              </button>
              <button
                onClick={() => setActiveTab('content')}
                className={`py-4 px-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'content'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Rss className="h-4 w-4 inline mr-2" />
                Content Sources
              </button>
              <button
                onClick={() => setActiveTab('assets')}
                className={`py-4 px-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'assets'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <ImageIcon className="h-4 w-4 inline mr-2" />
                Brand Assets
              </button>
            </div>
          </div>
        </div>

        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {activeTab === 'ai' && 'AI Settings'}
                {activeTab === 'variables' && 'Brand Variables'}
                {activeTab === 'brand' && 'Brand Training'}
                {activeTab === 'content' && 'Content Sources'}
                {activeTab === 'assets' && 'Brand Assets'}
              </h1>
              <p className="text-sm text-gray-600">
                {activeTab === 'ai' && 'Configure your AI and platform preferences'}
                {activeTab === 'variables' && 'Define specific brand details for AI-generated content'}
                {activeTab === 'brand' && 'Train AI on your brand voice and values'}
                {activeTab === 'content' && 'Manage RSS feeds and content sources'}
                {activeTab === 'assets' && 'Manage your logos, watermarks, and brand images'}
              </p>
            </div>
            {activeTab === 'ai' && (
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
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {activeTab === 'variables' && <BrandVariablesTab />}
            {activeTab === 'assets' && <BrandAssetsTab />}
            {activeTab === 'ai' && (
              <div className="space-y-6">
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
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Brand Voice
                      </label>
                      <textarea
                        className="w-full min-h-[100px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe your brand's unique voice and personality..."
                        value={config.brandVoice}
                        onChange={(e) => setConfig({ ...config, brandVoice: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Tone Preference
                      </label>
                      <select
                        className="w-full p-2 border rounded-lg"
                        value={config.tonePreference}
                        onChange={(e) => setConfig({ ...config, tonePreference: e.target.value })}
                      >
                        <option value="professional">Professional</option>
                        <option value="casual">Casual</option>
                        <option value="enthusiastic">Enthusiastic</option>
                        <option value="technical">Technical</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Default Post Length
                      </label>
                      <select
                        className="w-full p-2 border rounded-lg"
                        value={config.postLength}
                        onChange={(e) => setConfig({ ...config, postLength: e.target.value })}
                      >
                        <option value="short">Short (100-150 words)</option>
                        <option value="medium">Medium (150-250 words)</option>
                        <option value="long">Long (250-400 words)</option>
                      </select>
                    </div>

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
                          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
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
                          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            {activeTab === 'brand' && <BrandTrainingTab />}
            {activeTab === 'content' && <ContentSourcesTab />}
          </div>
        </main>
      </div>
    </div>
  )
}
