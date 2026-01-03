'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  CreditCard, 
  Key, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  EyeOff,
  Save
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface StripeConfig {
  publishableKey?: string
  secretKey?: string
  webhookSecret?: string
  priceIds: {
    STARTER?: string
    PROFESSIONAL?: string
    ENTERPRISE?: string
  }
  testMode: boolean
  isConfigured: boolean
}

export default function StripeConfigPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [config, setConfig] = useState<StripeConfig>({
    priceIds: {},
    testMode: true,
    isConfigured: false
  })
  
  const [showSecrets, setShowSecrets] = useState({
    secretKey: false,
    webhookSecret: false
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user) {
      router.push('/login')
      return
    }

    // Check if user is SUPER_ADMIN
    if (session.user.role !== 'SUPER_ADMIN') {
      router.push('/dashboard')
      return
    }

    fetchStripeConfig()
  }, [session, status, router])

  const fetchStripeConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/super-admin/stripe/config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data.config || {
          priceIds: {},
          testMode: true,
          isConfigured: false
        })
      }
    } catch (error) {
      console.error('Error fetching Stripe config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    
    try {
      const response = await fetch('/api/super-admin/stripe/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save configuration')
      }

      toast({
        title: 'Configuration saved',
        description: 'Stripe configuration has been updated successfully.'
      })

      fetchStripeConfig()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save configuration',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    
    try {
      const response = await fetch('/api/super-admin/stripe/test', {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Connection test failed')
      }

      toast({
        title: 'Connection successful',
        description: `Connected to Stripe successfully. Account ID: ${data.accountId}`,
      })
    } catch (error: any) {
      toast({
        title: 'Connection failed',
        description: error.message || 'Failed to connect to Stripe',
        variant: 'destructive'
      })
    } finally {
      setTesting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading Stripe configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stripe Configuration</h1>
          <p className="text-muted-foreground mt-1">
            Configure Stripe API keys and payment settings
          </p>
        </div>
        <Badge variant={config.isConfigured ? 'default' : 'secondary'}>
          {config.isConfigured ? 'Configured' : 'Not Configured'}
        </Badge>
      </div>

      {/* Test Mode Warning */}
      {config.testMode && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">Test Mode Active</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-200 mt-1">
                  You are currently using Stripe in test mode. No real charges will be made. 
                  Switch to live mode in production.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys
          </CardTitle>
          <CardDescription>
            Your Stripe API keys for authentication. Get these from your{' '}
            <a 
              href="https://dashboard.stripe.com/apikeys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Stripe Dashboard
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Publishable Key */}
          <div className="space-y-2">
            <Label htmlFor="publishableKey">Publishable Key</Label>
            <Input
              id="publishableKey"
              placeholder="pk_test_..."
              value={config.publishableKey || ''}
              onChange={(e) => setConfig({...config, publishableKey: e.target.value})}
            />
            <p className="text-xs text-muted-foreground">
              Starts with pk_test_ (test mode) or pk_live_ (live mode)
            </p>
          </div>

          {/* Secret Key */}
          <div className="space-y-2">
            <Label htmlFor="secretKey">Secret Key</Label>
            <div className="relative">
              <Input
                id="secretKey"
                type={showSecrets.secretKey ? 'text' : 'password'}
                placeholder="sk_test_..."
                value={config.secretKey || ''}
                onChange={(e) => setConfig({...config, secretKey: e.target.value})}
                className="pr-10"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowSecrets({...showSecrets, secretKey: !showSecrets.secretKey})}
              >
                {showSecrets.secretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Starts with sk_test_ (test mode) or sk_live_ (live mode)
            </p>
          </div>

          {/* Webhook Secret */}
          <div className="space-y-2">
            <Label htmlFor="webhookSecret">Webhook Secret</Label>
            <div className="relative">
              <Input
                id="webhookSecret"
                type={showSecrets.webhookSecret ? 'text' : 'password'}
                placeholder="whsec_..."
                value={config.webhookSecret || ''}
                onChange={(e) => setConfig({...config, webhookSecret: e.target.value})}
                className="pr-10"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowSecrets({...showSecrets, webhookSecret: !showSecrets.webhookSecret})}
              >
                {showSecrets.webhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get this from your Stripe Webhook settings. Required for payment notifications.
            </p>
          </div>

          <Separator />

          {/* Test Connection */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Test Connection</p>
              <p className="text-sm text-muted-foreground">
                Verify your API keys are valid
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={!config.secretKey || testing}
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Price IDs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Price IDs
          </CardTitle>
          <CardDescription>
            Map each subscription plan to its Stripe Price ID. Create these in your{' '}
            <a 
              href="https://dashboard.stripe.com/products" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Stripe Products
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* STARTER */}
          <div className="space-y-2">
            <Label htmlFor="priceStarter">STARTER Plan ($29/month)</Label>
            <Input
              id="priceStarter"
              placeholder="price_..."
              value={config.priceIds.STARTER || ''}
              onChange={(e) => setConfig({
                ...config, 
                priceIds: {...config.priceIds, STARTER: e.target.value}
              })}
            />
          </div>

          {/* PROFESSIONAL */}
          <div className="space-y-2">
            <Label htmlFor="priceProfessional">PROFESSIONAL Plan ($99/month)</Label>
            <Input
              id="priceProfessional"
              placeholder="price_..."
              value={config.priceIds.PROFESSIONAL || ''}
              onChange={(e) => setConfig({
                ...config, 
                priceIds: {...config.priceIds, PROFESSIONAL: e.target.value}
              })}
            />
          </div>

          {/* ENTERPRISE */}
          <div className="space-y-2">
            <Label htmlFor="priceEnterprise">ENTERPRISE Plan ($299/month)</Label>
            <Input
              id="priceEnterprise"
              placeholder="price_..."
              value={config.priceIds.ENTERPRISE || ''}
              onChange={(e) => setConfig({
                ...config, 
                priceIds: {...config.priceIds, ENTERPRISE: e.target.value}
              })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Mode Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Mode</CardTitle>
          <CardDescription>
            Switch between test and live mode
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Test Mode</p>
              <p className="text-sm text-muted-foreground">
                Use test API keys and no real charges
              </p>
            </div>
            <Button
              variant={config.testMode ? 'default' : 'outline'}
              onClick={() => setConfig({...config, testMode: !config.testMode})}
            >
              {config.testMode ? 'Test Mode' : 'Live Mode'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push('/dashboard/super-admin')}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  )
}
