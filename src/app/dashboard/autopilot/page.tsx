'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  Zap, Play, Pause, Settings as SettingsIcon, Calendar,
  Clock, Target, TrendingUp, Sparkles, AlertCircle, CheckCircle2
} from 'lucide-react'

interface AutoPilotConfig {
  enabled: boolean
  postsPerWeek: number
  confidenceThreshold: number
  autoSchedule: boolean
  preferredTimes: string[]
  topics: string[]
}

export default function AutoPilotPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [config, setConfig] = useState<AutoPilotConfig>({
    enabled: false,
    postsPerWeek: 5,
    confidenceThreshold: 0.8,
    autoSchedule: true,
    preferredTimes: ['09:00', '12:00', '17:00'],
    topics: []
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [newTopic, setNewTopic] = useState('')

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/autopilot/config')
      if (response.ok) {
        const data = await response.json()
        if (data.config) {
          setConfig(data.config)
        }
      }
    } catch (error) {
      console.error('Failed to fetch config:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/autopilot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        toast({
          title: 'Configuration saved',
          description: 'Auto-Pilot settings have been updated'
        })
      }
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Failed to save configuration',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleAutoPilot = async () => {
    const newEnabled = !config.enabled
    setConfig({ ...config, enabled: newEnabled })
    
    try {
      await fetch('/api/autopilot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, enabled: newEnabled })
      })

      toast({
        title: newEnabled ? 'Auto-Pilot enabled' : 'Auto-Pilot disabled',
        description: newEnabled 
          ? 'System will automatically generate and schedule posts'
          : 'Automatic post generation has been stopped'
      })
    } catch (error) {
      toast({
        title: 'Failed to toggle',
        description: 'Could not change Auto-Pilot status',
        variant: 'destructive'
      })
      setConfig({ ...config, enabled: !newEnabled }) // Revert
    }
  }

  const generateBulk = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/autopilot/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: config.postsPerWeek,
          confidenceThreshold: config.confidenceThreshold,
          topics: config.topics
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'Bulk generation complete',
          description: `Generated ${data.created} posts successfully`
        })
      }
    } catch (error) {
      toast({
        title: 'Generation failed',
        description: 'Failed to generate posts',
        variant: 'destructive'
      })
    } finally {
      setGenerating(false)
    }
  }

  const addTopic = () => {
    if (newTopic.trim() && !config.topics.includes(newTopic.trim())) {
      setConfig({
        ...config,
        topics: [...config.topics, newTopic.trim()]
      })
      setNewTopic('')
    }
  }

  const removeTopic = (topic: string) => {
    setConfig({
      ...config,
      topics: config.topics.filter(t => t !== topic)
    })
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Zap className="h-8 w-8 text-yellow-500" />
              Auto-Pilot Mode
            </h1>
            <p className="text-muted-foreground mt-2">
              Let AI automatically generate and schedule your content
            </p>
          </div>

          <Button
            size="lg"
            onClick={toggleAutoPilot}
            className={config.enabled ? 'bg-green-500 hover:bg-green-600' : ''}
          >
            {config.enabled ? (
              <>
                <Pause className="h-5 w-5 mr-2" />
                Pause Auto-Pilot
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Enable Auto-Pilot
              </>
            )}
          </Button>
        </div>

        {/* Quick Actions - Moved to top for better visibility */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            size="lg" 
            variant="secondary"
            onClick={generateBulk}
            disabled={generating}
            className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            {generating ? 'Generating...' : 'Generate Posts Now'}
          </Button>

          <Button 
            size="lg" 
            onClick={saveConfig} 
            disabled={saving} 
            className="flex-1"
            variant="outline"
          >
            <SettingsIcon className="h-5 w-5 mr-2" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <Card className={config.enabled ? 'border-green-500 bg-green-50/50' : ''}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {config.enabled ? (
                <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <Pause className="h-6 w-6 text-gray-500" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold">
                  Auto-Pilot is {config.enabled ? 'Active' : 'Inactive'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {config.enabled
                    ? `Generating ${config.postsPerWeek} posts per week automatically`
                    : 'Enable to start automatic content generation'}
                </p>
              </div>
            </div>

            {config.enabled && (
              <Badge className="bg-green-500">
                <Sparkles className="h-3 w-3 mr-1" />
                Running
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generation Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Generation Settings
            </CardTitle>
            <CardDescription>
              Configure how Auto-Pilot generates content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Posts Per Week: {config.postsPerWeek}
              </label>
              <input
                type="range"
                min="1"
                max="14"
                value={config.postsPerWeek}
                onChange={(e) => setConfig({ ...config, postsPerWeek: parseInt(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(config.postsPerWeek / 7)} per day on average
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Confidence Threshold: {(config.confidenceThreshold * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="50"
                max="100"
                value={config.confidenceThreshold * 100}
                onChange={(e) => setConfig({ ...config, confidenceThreshold: parseInt(e.target.value) / 100 })}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Only auto-publish posts with confidence above this threshold
              </p>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Auto-Schedule</p>
                <p className="text-sm text-muted-foreground">
                  Automatically schedule generated posts
                </p>
              </div>
              <Button
                variant={config.autoSchedule ? 'default' : 'outline'}
                size="sm"
                onClick={() => setConfig({ ...config, autoSchedule: !config.autoSchedule })}
              >
                {config.autoSchedule ? 'On' : 'Off'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Topics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Content Topics
            </CardTitle>
            <CardDescription>
              Define topics for Auto-Pilot to focus on
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., AI trends, Product updates"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTopic()}
              />
              <Button onClick={addTopic}>Add</Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {config.topics.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No topics yet. Add topics to guide content generation.
                </p>
              ) : (
                config.topics.map((topic) => (
                  <Badge key={topic} variant="secondary" className="gap-1">
                    {topic}
                    <button
                      onClick={() => removeTopic(topic)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preferred Times */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Preferred Publishing Times
          </CardTitle>
          <CardDescription>
            Best times to publish for maximum engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {['06:00', '09:00', '12:00', '14:00', '17:00', '20:00'].map((time) => (
              <Button
                key={time}
                variant={config.preferredTimes.includes(time) ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  if (config.preferredTimes.includes(time)) {
                    setConfig({
                      ...config,
                      preferredTimes: config.preferredTimes.filter(t => t !== time)
                    })
                  } else {
                    setConfig({
                      ...config,
                      preferredTimes: [...config.preferredTimes, time]
                    })
                  }
                }}
              >
                {time}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50/50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-blue-900">How Auto-Pilot Works</p>
              <ul className="space-y-1 text-blue-800">
                <li>• AI generates content based on your topics and brand voice</li>
                <li>• Posts are filtered by confidence threshold</li>
                <li>• High-confidence posts are automatically scheduled</li>
                <li>• Low-confidence posts are saved as drafts for review</li>
                <li>• Publishing happens at your preferred times</li>
                <li>• You maintain full control and can pause anytime</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
