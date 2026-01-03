'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  Building2, Users, FileText, Rss, Image as ImageIcon, Shield, 
  Plus, Edit, Trash2, Eye, Search, ChevronRight, TrendingUp,
  Calendar, Globe, Briefcase, CreditCard
} from 'lucide-react'

interface TenantStats {
  users: number
  posts: number
  contentSources: number
  brandAssets: number
}

interface TenantAdmin {
  id: string
  name: string | null
  email: string
}

interface Tenant {
  id: string
  name: string
  domain: string | null
  website: string | null
  industry: string | null
  description: string | null
  logo: string | null
  createdAt: string
  updatedAt: string
  stats: TenantStats
  admins: TenantAdmin[]
  aiConfig: {
    selectedModel: string
    brandVoice: string | null
    companyName: string | null
  } | null
  autoPilotConfig: {
    enabled: boolean
    postsPerWeek: number
  } | null
}

export default function SuperAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)

  useEffect(() => {
    // Check if user is SUPER_ADMIN
    if (status === 'loading') return
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      router.push('/dashboard')
      return
    }

    fetchTenants()
  }, [session, status, router])

  const fetchTenants = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/super-admin/tenants')
      
      if (!response.ok) {
        throw new Error('Failed to fetch tenants')
      }

      const data = await response.json()
      setTenants(data.tenants || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load tenants',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteTenant = async (tenantId: string, tenantName: string) => {
    if (!confirm(`Are you sure you want to DELETE tenant "${tenantName}"? This will delete ALL data including users, posts, and configurations. This action CANNOT be undone!`)) {
      return
    }

    try {
      const response = await fetch(`/api/super-admin/tenants/${tenantId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setTenants(tenants.filter(t => t.id !== tenantId))
        toast({
          title: 'Tenant deleted',
          description: `${tenantName} has been permanently deleted`,
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete tenant')
      }
    } catch (error: any) {
      toast({
        title: 'Failed to delete',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const viewTenantDetails = (tenant: Tenant) => {
    setSelectedTenant(tenant)
  }

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Show loading or access denied
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

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-red-500" />
            Super Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage all tenants across the platform
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tenants</p>
                <p className="text-3xl font-bold">{tenants.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold">
                  {tenants.reduce((sum, t) => sum + t.stats.users, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Posts</p>
                <p className="text-3xl font-bold">
                  {tenants.reduce((sum, t) => sum + t.stats.posts, 0)}
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Auto-Pilots</p>
                <p className="text-3xl font-bold">
                  {tenants.filter(t => t.autoPilotConfig?.enabled).length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            All Tenants ({filteredTenants.length})
          </CardTitle>
          <CardDescription>
            View and manage all tenants on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, domain, or industry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => router.push('/dashboard/super-admin/billing')}>
              <CreditCard className="h-4 w-4 mr-2" />
              Billing
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard/super-admin/settings/stripe')}>
              <Shield className="h-4 w-4 mr-2" />
              Stripe
            </Button>
            <Button onClick={() => router.push('/dashboard/super-admin/tenants/new')}>
              <Plus className="h-4 w-4 mr-2" />
              New Tenant
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading tenants...
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tenants found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try a different search query' : 'Create your first tenant to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTenants.map((tenant) => (
                <Card key={tenant.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {tenant.logo ? (
                            <img src={tenant.logo} alt={tenant.name} className="h-10 w-10 rounded" />
                          ) : (
                            <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div>
                            <h3 className="text-lg font-semibold">{tenant.name}</h3>
                            {tenant.domain && (
                              <p className="text-sm text-muted-foreground">{tenant.domain}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{tenant.stats.users} users</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>{tenant.stats.posts} posts</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Rss className="h-4 w-4 text-muted-foreground" />
                            <span>{tenant.stats.contentSources} sources</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{tenant.stats.brandAssets} assets</span>
                          </div>
                        </div>

                        {tenant.industry && (
                          <div className="flex items-center gap-2 mt-3">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <Badge variant="outline">{tenant.industry}</Badge>
                          </div>
                        )}

                        {tenant.autoPilotConfig?.enabled && (
                          <Badge className="mt-2 bg-green-500">
                            Auto-Pilot Active ({tenant.autoPilotConfig.postsPerWeek}/week)
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewTenantDetails(tenant)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/super-admin/tenants/${tenant.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTenant(tenant.id, tenant.name)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/dashboard/super-admin/impersonate/${tenant.id}`)}
                        >
                          Access Tenant <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
