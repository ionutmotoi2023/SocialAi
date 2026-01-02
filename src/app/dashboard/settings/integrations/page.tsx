'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Linkedin, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

interface LinkedInIntegration {
  id: string
  linkedinId: string
  profileName?: string
  profileImage?: string
  isActive: boolean
  expiresAt?: string
  createdAt: string
}

export default function IntegrationsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [integration, setIntegration] = useState<LinkedInIntegration | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  useEffect(() => {
    fetchIntegration()
  }, [])

  const fetchIntegration = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/integrations/linkedin')
      if (response.ok) {
        const data = await response.json()
        if (data.integration) {
          setIntegration(data.integration)
        }
      }
    } catch (error) {
      console.error('Failed to fetch integration:', error)
    } finally {
      setIsLoading(false)
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
        // Refresh integration status
        fetchIntegration()
      }
    }, 500)
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your LinkedIn account?')) {
      return
    }

    setIsDisconnecting(true)

    try {
      const response = await fetch('/api/integrations/linkedin', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect')
      }

      toast({
        title: 'Success',
        description: 'LinkedIn account disconnected',
      })

      setIntegration(null)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to disconnect LinkedIn',
        variant: 'destructive',
      })
    } finally {
      setIsDisconnecting(false)
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
                        {integration?.isActive && (
                          <Badge className="ml-2 bg-green-500">Connected</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Publish posts directly to your LinkedIn profile
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {!integration ? (
                  // Not connected state
                  <div className="text-center py-8">
                    <Linkedin className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Connect LinkedIn</h3>
                    <p className="text-gray-600 mb-6">
                      Connect your LinkedIn account to publish posts directly from the platform
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
                      <p className="text-sm text-blue-900 font-medium mb-2">Required Permissions:</p>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Read your profile information</li>
                        <li>• Post content on your behalf</li>
                        <li>• Access your email address</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  // Connected state
                  <div className="space-y-4">
                    {/* Profile Info */}
                    {integration.profileImage && (
                      <div className="flex items-center space-x-4">
                        <img
                          src={integration.profileImage}
                          alt="LinkedIn Profile"
                          className="w-16 h-16 rounded-full"
                        />
                        <div>
                          <p className="font-semibold">{integration.profileName || 'LinkedIn User'}</p>
                          <p className="text-sm text-gray-500">ID: {integration.linkedinId}</p>
                        </div>
                      </div>
                    )}

                    {/* Status */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Status</p>
                        <div className="flex items-center">
                          {integration.isActive ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                              <span className="text-sm font-medium text-green-600">Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-600 mr-2" />
                              <span className="text-sm font-medium text-red-600">Inactive</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Connected Since</p>
                        <p className="text-sm font-medium">
                          {format(new Date(integration.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      {integration.expiresAt && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-600 mb-1">Token Expires</p>
                          <p className="text-sm font-medium">
                            {format(new Date(integration.expiresAt), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={handleTestConnection}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Test Connection
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleConnect}
                        disabled={isConnecting}
                      >
                        {isConnecting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          'Reconnect'
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDisconnect}
                        disabled={isDisconnecting}
                      >
                        {isDisconnecting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Disconnecting...
                          </>
                        ) : (
                          'Disconnect'
                        )}
                      </Button>
                    </div>

                    {/* Info */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-900 font-medium mb-1">
                        Your LinkedIn account is connected!
                      </p>
                      <p className="text-sm text-blue-800">
                        You can now publish posts directly to LinkedIn from the calendar or post creation page.
                      </p>
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
