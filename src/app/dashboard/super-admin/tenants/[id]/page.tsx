'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EditTenantForm } from '@/components/super-admin/edit-tenant-form'
import { ArrowLeft, Building2, Shield, Loader2 } from 'lucide-react'

interface Tenant {
  id: string
  name: string
  domain: string | null
  website: string | null
  industry: string | null
  description: string | null
  logo: string | null
}

interface TenantSubscription {
  plan: string
  status: string
  postsUsed: number
  usersUsed: number
  aiCreditsUsed: number
  postsLimit: number
  usersLimit: number
  aiCreditsLimit: number
}

interface TenantUser {
  id: string
  name: string | null
  email: string
  role: string
}

interface TenantDetails {
  tenant: Tenant
  subscription: TenantSubscription | null
  users: TenantUser[]
}

export default function EditTenantPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const tenantId = params.id as string

  const [tenantDetails, setTenantDetails] = useState<TenantDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is SUPER_ADMIN
    if (status === 'loading') return
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      router.push('/dashboard')
      return
    }

    fetchTenantDetails()
  }, [session, status, router, tenantId])

  const fetchTenantDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/super-admin/tenants/${tenantId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch tenant details')
      }

      const data = await response.json()
      
      // Extract subscription data
      const subscription = data.tenant.subscriptions?.[0] || null

      setTenantDetails({
        tenant: data.tenant,
        subscription: subscription,
        users: data.tenant.users || [],
      })
    } catch (error: any) {
      console.error('Error fetching tenant:', error)
      setError(error.message || 'Failed to load tenant details')
    } finally {
      setLoading(false)
    }
  }

  // Show loading state
  if (status === 'loading' || loading || !session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto text-muted-foreground animate-spin" />
          <p className="mt-4 text-muted-foreground">Loading tenant details...</p>
        </div>
      </div>
    )
  }

  // Access denied for non-SUPER_ADMIN
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
            <Shield className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Tenant</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.push('/dashboard/super-admin')}>
              Back to Tenants
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No data found
  if (!tenantDetails) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tenant Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The requested tenant could not be found
            </p>
            <Button onClick={() => router.push('/dashboard/super-admin')}>
              Back to Tenants
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSuccess = () => {
    router.push('/dashboard/super-admin')
    router.refresh()
  }

  const handleCancel = () => {
    router.push('/dashboard/super-admin')
  }

  const handleDelete = () => {
    router.push('/dashboard/super-admin')
    router.refresh()
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/super-admin')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tenants
        </Button>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          Edit Tenant
        </h1>
        <p className="text-muted-foreground mt-2">
          Update tenant information and subscription plan
        </p>
      </div>

      {/* Form Card */}
      <Card>
        <CardContent className="pt-6">
          <EditTenantForm 
            tenantId={tenantId}
            initialData={{
              name: tenantDetails.tenant.name,
              domain: tenantDetails.tenant.domain,
              website: tenantDetails.tenant.website,
              industry: tenantDetails.tenant.industry,
              description: tenantDetails.tenant.description,
            }}
            subscription={tenantDetails.subscription || undefined}
            users={tenantDetails.users}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
    </div>
  )
}
