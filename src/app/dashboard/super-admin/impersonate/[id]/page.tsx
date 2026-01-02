'use client'

import { useEffect, useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Loader2, UserCircle, Building2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ImpersonationData {
  originalUser: {
    id: string
    email: string
    role: string
  }
  targetUser: {
    id: string
    email: string
    name: string | null
    role: string
  }
  tenant: {
    id: string
    name: string
    domain: string | null
  }
}

export default function ImpersonatePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const tenantId = params.id as string

  const [impersonationData, setImpersonationData] = useState<ImpersonationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [impersonating, setImpersonating] = useState(false)

  useEffect(() => {
    // Check if user is SUPER_ADMIN
    if (status === 'loading') return
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      router.push('/dashboard')
      return
    }

    setupImpersonation()
  }, [session, status, router, tenantId])

  const setupImpersonation = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/super-admin/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to setup impersonation')
      }

      setImpersonationData(data.impersonation)
    } catch (error: any) {
      console.error('Error setting up impersonation:', error)
      setError(error.message || 'Failed to setup impersonation')
    } finally {
      setLoading(false)
    }
  }

  const handleImpersonate = async () => {
    if (!impersonationData) return

    try {
      setImpersonating(true)

      // Store original session info in localStorage for restoration
      localStorage.setItem('impersonation', JSON.stringify({
        originalUserId: impersonationData.originalUser.id,
        originalUserEmail: impersonationData.originalUser.email,
        originalUserRole: impersonationData.originalUser.role,
        impersonatedTenantId: impersonationData.tenant.id,
        impersonatedTenantName: impersonationData.tenant.name,
        startedAt: new Date().toISOString(),
      }))

      toast({
        title: 'Impersonation started',
        description: `Now viewing as ${impersonationData.targetUser.email}`,
      })

      // Redirect to tenant dashboard
      // The ImpersonationBanner will detect the localStorage flag
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      console.error('Error starting impersonation:', error)
      toast({
        title: 'Failed to start impersonation',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setImpersonating(false)
    }
  }

  const handleCancel = () => {
    router.push('/dashboard/super-admin')
  }

  // Loading state
  if (status === 'loading' || loading || !session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto text-muted-foreground animate-spin" />
          <p className="mt-4 text-muted-foreground">Setting up impersonation...</p>
        </div>
      </div>
    )
  }

  // Access denied
  if (session.user.role !== 'SUPER_ADMIN') {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              Super Admin access required
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.push('/dashboard/super-admin')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No impersonation data
  if (!impersonationData) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <UserCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Setup Failed</h3>
            <p className="text-muted-foreground mb-4">
              Could not setup impersonation for this tenant
            </p>
            <Button onClick={() => router.push('/dashboard/super-admin')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <UserCircle className="h-8 w-8 text-primary" />
          Impersonate Tenant
        </h1>
        <p className="text-muted-foreground mt-2">
          View the dashboard as a user from this tenant
        </p>
      </div>

      {/* Confirmation Card */}
      <Card>
        <CardHeader>
          <CardTitle>Confirm Impersonation</CardTitle>
          <CardDescription>
            You are about to view the platform as a user from this tenant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current User Info */}
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Your Identity (SUPER_ADMIN)</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {impersonationData.originalUser.email}
            </p>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="text-2xl text-muted-foreground">↓</div>
          </div>

          {/* Target Tenant Info */}
          <div className="p-4 rounded-lg border-2 border-primary">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-5 w-5 text-primary" />
              <p className="font-semibold">{impersonationData.tenant.name}</p>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">You will view as:</p>
                <p className="text-sm font-medium">
                  {impersonationData.targetUser.name || 'Unnamed User'} ({impersonationData.targetUser.email})
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role:</p>
                <p className="text-sm font-medium">{impersonationData.targetUser.role}</p>
              </div>
              {impersonationData.tenant.domain && (
                <div>
                  <p className="text-sm text-muted-foreground">Domain:</p>
                  <p className="text-sm font-medium">{impersonationData.tenant.domain}</p>
                </div>
              )}
            </div>
          </div>

          {/* Warning */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-amber-900">Important Notes:</p>
                  <ul className="list-disc list-inside text-amber-800 space-y-1">
                    <li>You will see the dashboard as this tenant user</li>
                    <li>All data and permissions are scoped to this tenant</li>
                    <li>A banner will remind you that you're impersonating</li>
                    <li>Click "Exit Impersonation" to return to Super Admin view</li>
                    <li>Actions you take will be as this user (be careful!)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4">
            <Button
              size="lg"
              onClick={handleImpersonate}
              disabled={impersonating}
            >
              {impersonating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start Impersonation
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={handleCancel}
              disabled={impersonating}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
