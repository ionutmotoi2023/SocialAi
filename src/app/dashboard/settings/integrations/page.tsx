'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Linkedin, CheckCircle, XCircle, Loader2, ExternalLink, HardDrive, Cloud } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

interface LinkedInIntegration {
  id: string
  linkedinId: string
  profileName?: string
  profileImage?: string
  profileType: 'PERSONAL' | 'COMPANY_PAGE'
  organizationName?: string
  organizationId?: string
  isActive: boolean
  expiresAt?: string
  createdAt: string
}

interface GoogleDriveIntegration {
  id: string
  provider: string
  email?: string
  folderPath?: string
  isActive: boolean
  lastSyncAt?: string
  syncedFilesCount?: number
  createdAt: string
}

export default function IntegrationsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [integrations, setIntegrations] = useState<LinkedInIntegration[]>([])
  const [driveIntegration, setDriveIntegration] = useState<GoogleDriveIntegration | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null)
  const [isDriveConnecting, setIsDriveConnecting] = useState(false)
  const [isDriveDisconnecting, setIsDriveDisconnecting] = useState(false)

  useEffect(() => {
    fetchIntegrations()
    fetchDriveIntegration()
  }, [])

  const fetchIntegrations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/integrations/linkedin')
      if (response.ok) {
        const data = await response.json()
        setIntegrations(data.integrations || [])
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDriveIntegration = async () => {
    try {
      const response = await fetch('/api/integrations/google-drive/status')
      if (response.ok) {
        const data = await response.json()
        if (data.connected) {
          setDriveIntegration(data.integration)
        }
      }
    } catch (error) {
      console.error('Failed to fetch Drive integration:', error)
    }
  }

  const handleConnect = async () => {
    setIsConnecting(true)
    
    // Open LinkedIn OAuth in popup
    const width = 600
    const height = 700
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2

    const linkedInAuthUrl = `/api/integrations/linkedin/auth`
    
    const popup = window.open(
      linkedInAuthUrl,
      'LinkedIn OAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    )

    // Listen for OAuth callback
    const checkPopup = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkPopup)
        setIsConnecting(false)
        // Refresh integrations status
        fetchIntegrations()
      }
    }, 500)
  }

  const handleDisconnect = async (integrationId: string, profileName: string) => {
    if (!confirm(`Are you sure you want to disconnect ${profileName}?`)) {
      return
    }

    setDisconnectingId(integrationId)

    try {
      const response = await fetch(`/api/integrations/linkedin?id=${integrationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect')
      }

      toast({
        title: 'Success',
        description: `${profileName} disconnected`,
      })

      // Remove from local state
      setIntegrations(integrations.filter(i => i.id !== integrationId))
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to disconnect LinkedIn',
        variant: 'destructive',
      })
    } finally {
      setDisconnectingId(null)
    }
  }

  const handleTestConnection = async () => {
    try {
      const response = await fetch('/api/integrations/linkedin/test')
      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Connected as ${data.profile.firstName} ${data.profile.lastName}`,
        })
      } else {
        throw new Error(data.error || 'Connection test failed')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Connection test failed',
        variant: 'destructive',
      })
    }
  }

  const handleDriveConnect = async () => {
    setIsDriveConnecting(true)
    
    // Open Google Drive OAuth in popup
    const width = 600
    const height = 700
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2

    const driveAuthUrl = `/api/integrations/google-drive/connect`
    
    const popup = window.open(
      driveAuthUrl,
      'Google Drive OAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    )

    // Listen for OAuth callback
    const checkPopup = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkPopup)
        setIsDriveConnecting(false)
        // Refresh integration status
        fetchDriveIntegration()
        toast({
          title: 'Success',
          description: 'Google Drive connected successfully',
        })
      }
    }, 500)
  }

  const handleDriveDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Drive?')) {
      return
    }

    setIsDriveDisconnecting(true)

    try {
      const response = await fetch('/api/integrations/google-drive/disconnect', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect')
      }

      toast({
        title: 'Success',
        description: 'Google Drive disconnected',
      })

      setDriveIntegration(null)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to disconnect Google Drive',
        variant: 'destructive',
      })
    } finally {
      setIsDriveDisconnecting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading integrations...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
              <p className="text-sm text-gray-600">Connect your social media accounts</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* LinkedIn Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Linkedin className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center">
                        LinkedIn
                        {integrations.length > 0 && (
                          <Badge className="ml-2 bg-green-500">
                            {integrations.length} Connected
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Publish posts to your personal profile or company pages
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {integrations.length === 0 ? (
                  // No connections state
                  <div className="text-center py-8">
                    <Linkedin className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Connect LinkedIn</h3>
                    <p className="text-gray-600 mb-6">
                      Connect your LinkedIn profile or company pages to publish posts directly
                    </p>
                    <Button
                      onClick={handleConnect}
                      disabled={isConnecting}
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Linkedin className="mr-2 h-4 w-4" />
                          Connect LinkedIn
                        </>
                      )}
                    </Button>
                    
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-900 font-medium mb-2">What you can connect:</p>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Your personal LinkedIn profile</li>
                        <li>• Company pages you manage</li>
                        <li>• You can add multiple profiles!</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  // Connected profiles
                  <div className="space-y-4">
                    {/* Connected profiles list */}
                    {integrations.map((integration) => (
                      <div 
                        key={integration.id} 
                        className="p-4 border rounded-lg bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-4">
                            {integration.profileImage && (
                              <img
                                src={integration.profileImage}
                                alt="LinkedIn Profile"
                                className="w-14 h-14 rounded-full"
                              />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">
                                  {integration.profileType === 'COMPANY_PAGE' 
                                    ? integration.organizationName 
                                    : integration.profileName || 'LinkedIn User'}
                                </p>
                                <Badge 
                                  className={
                                    integration.profileType === 'COMPANY_PAGE' 
                                      ? 'bg-purple-500' 
                                      : 'bg-blue-500'
                                  }
                                >
                                  {integration.profileType === 'COMPANY_PAGE' ? 'Company Page' : 'Personal'}
                                </Badge>
                                {integration.isActive && (
                                  <Badge className="bg-green-500">Active</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                ID: {integration.linkedinId}
                              </p>
                              <p className="text-sm text-gray-500">
                                Connected: {format(new Date(integration.createdAt), 'MMM dd, yyyy')}
                              </p>
                              {integration.expiresAt && (
                                <p className="text-xs text-gray-400">
                                  Expires: {format(new Date(integration.expiresAt), 'MMM dd, yyyy')}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDisconnect(
                              integration.id, 
                              integration.profileType === 'COMPANY_PAGE' 
                                ? integration.organizationName || 'Company Page'
                                : integration.profileName || 'Profile'
                            )}
                            disabled={disconnectingId === integration.id}
                          >
                            {disconnectingId === integration.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Disconnect'
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Add another button */}
                    <Button
                      variant="outline"
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="w-full"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Linkedin className="mr-2 h-4 w-4" />
                          Connect Another Profile
                        </>
                      )}
                    </Button>

                    {/* Info */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-900 font-medium mb-1">
                        {integrations.length} LinkedIn {integrations.length === 1 ? 'profile' : 'profiles'} connected!
                      </p>
                      <p className="text-sm text-blue-800">
                        You can select which profile to use when creating posts.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Google Drive Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                      <HardDrive className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center">
                        Google Drive
                        {driveIntegration && (
                          <Badge className="ml-2 bg-green-500">
                            Connected
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Auto-sync images and videos from Google Drive for Auto-Pilot posts
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {!driveIntegration ? (
                  // No connection state
                  <div className="text-center py-8">
                    <Cloud className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Connect Google Drive</h3>
                    <p className="text-gray-600 mb-6">
                      Enable Auto-Pilot to automatically create posts from your Drive images and videos
                    </p>
                    <Button
                      onClick={handleDriveConnect}
                      disabled={isDriveConnecting}
                      size="lg"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isDriveConnecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <HardDrive className="mr-2 h-4 w-4" />
                          Connect Google Drive
                        </>
                      )}
                    </Button>
                    
                    <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-900 font-medium mb-2">How it works:</p>
                      <ul className="text-sm text-green-800 space-y-1 text-left">
                        <li>• Upload images/videos to your synced Drive folder</li>
                        <li>• AI analyzes content using GPT-4o Vision</li>
                        <li>• Smart grouping creates multi-image posts</li>
                        <li>• Auto-generates captions and schedules posts</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  // Connected state
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center">
                            <HardDrive className="h-7 w-7 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">
                                {driveIntegration.email || 'Google Drive'}
                              </p>
                              <Badge className="bg-green-500">Active</Badge>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              Folder: {driveIntegration.folderPath || '/SocialAI'}
                            </p>
                            <p className="text-sm text-gray-500">
                              Connected: {format(new Date(driveIntegration.createdAt), 'MMM dd, yyyy')}
                            </p>
                            {driveIntegration.lastSyncAt && (
                              <p className="text-xs text-gray-400">
                                Last sync: {format(new Date(driveIntegration.lastSyncAt), 'MMM dd, yyyy HH:mm')}
                              </p>
                            )}
                            {driveIntegration.syncedFilesCount !== undefined && (
                              <p className="text-xs text-gray-400">
                                Files synced: {driveIntegration.syncedFilesCount}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDriveDisconnect}
                          disabled={isDriveDisconnecting}
                        >
                          {isDriveDisconnecting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Disconnect'
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-900 font-medium mb-1">
                        ✅ Google Drive connected!
                      </p>
                      <p className="text-sm text-green-800">
                        Upload images/videos to your Drive folder and Auto-Pilot will create posts automatically.
                      </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = '/dashboard/drive-media'}
                      >
                        View Synced Media
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = '/dashboard/autopilot'}
                      >
                        Configure Auto-Pilot
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Coming Soon Integrations */}
            <Card className="opacity-60">
              <CardHeader>
                <CardTitle className="flex items-center">
                  More Integrations
                  <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
                </CardTitle>
                <CardDescription>
                  Additional social platforms will be available soon
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 border-2 border-dashed rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Twitter/X</p>
                  </div>
                  <div className="text-center p-4 border-2 border-dashed rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Facebook</p>
                  </div>
                  <div className="text-center p-4 border-2 border-dashed rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Instagram</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
    </>
  )
}
