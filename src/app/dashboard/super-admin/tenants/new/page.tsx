'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreateTenantForm } from '@/components/super-admin/create-tenant-form'
import { ArrowLeft, Building2, Shield } from 'lucide-react'

export default function NewTenantPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Check if user is SUPER_ADMIN
    if (status === 'loading') return
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      router.push('/dashboard')
    }
  }, [session, status, router])

  // Show loading state
  if (status === 'loading' || !session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
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

  const handleSuccess = (tenantId: string) => {
    // Redirect to tenant detail page or back to list
    router.push(`/dashboard/super-admin`)
    router.refresh()
  }

  const handleCancel = () => {
    router.push('/dashboard/super-admin')
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
          Create New Tenant
        </h1>
        <p className="text-muted-foreground mt-2">
          Add a new tenant to the platform with subscription and admin user
        </p>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Tenant Information</CardTitle>
          <CardDescription>
            Fill in the details below to create a new tenant organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateTenantForm 
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <h4 className="font-semibold mb-2">ℹ️ What happens when you create a tenant?</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• A new tenant organization is created with the specified details</li>
            <li>• A subscription is set up with the selected plan and limits</li>
            <li>• Default AI and Auto-Pilot configurations are initialized</li>
            <li>• If specified, an admin user is created and can login immediately</li>
            <li>• Paid plans start with a 7-day trial period</li>
            <li>• The tenant admin can invite additional team members</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
