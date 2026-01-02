'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  CreditCard,
  Search,
  Calendar,
  Download,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface BillingStats {
  totalRevenue: number
  mrr: number
  arr: number
  activeTenants: number
  trialTenants: number
  canceledTenants: number
  averageRevenuePerTenant: number
  churnRate: number
}

interface TenantBilling {
  tenantId: string
  tenantName: string
  tenantDomain: string
  plan: string
  status: string
  amount: number
  billingCycle: string
  currentPeriodStart: string
  currentPeriodEnd: string
  trialEndsAt?: string
  canceledAt?: string
  lastInvoiceDate?: string
  lastInvoiceAmount?: number
  lastInvoiceStatus?: string
  totalRevenue: number
}

export default function BillingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<BillingStats | null>(null)
  const [tenants, setTenants] = useState<TenantBilling[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      router.push('/dashboard')
      return
    }

    fetchBillingData()
  }, [session, status, router])

  const fetchBillingData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/super-admin/billing')
      if (!response.ok) throw new Error('Failed to fetch billing data')
      const data = await response.json()
      setStats(data.stats)
      setTenants(data.tenants)
    } catch (error) {
      console.error('Error fetching billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTenants = tenants.filter(tenant =>
    tenant.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.tenantDomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.plan.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'TRIAL': return 'bg-blue-100 text-blue-800'
      case 'PAST_DUE': return 'bg-yellow-100 text-yellow-800'
      case 'CANCELED': return 'bg-red-100 text-red-800'
      case 'PAUSED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="h-4 w-4" />
      case 'TRIAL': return <Clock className="h-4 w-4" />
      case 'PAST_DUE': return <AlertCircle className="h-4 w-4" />
      case 'CANCELED': return <XCircle className="h-4 w-4" />
      case 'PAUSED': return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading billing data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Billing & Revenue</h1>
          <p className="text-muted-foreground mt-1">
            Manage subscriptions, invoices, and revenue
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/super-admin/billing/invoices')}>
          <CreditCard className="h-4 w-4 mr-2" />
          View All Invoices
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.mrr)}</div>
              <p className="text-xs text-muted-foreground">
                ARR: {formatCurrency(stats.arr)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeTenants}</div>
              <p className="text-xs text-muted-foreground">
                {stats.trialTenants} in trial, {stats.canceledTenants} canceled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Revenue/Tenant</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.averageRevenuePerTenant)}</div>
              <p className="text-xs text-muted-foreground">
                Churn rate: {stats.churnRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tenant Billing List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Tenant Subscriptions</CardTitle>
              <CardDescription>Manage all tenant billing and subscriptions</CardDescription>
            </div>
            <Button variant="outline" onClick={() => router.push('/dashboard/super-admin/billing/export')}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by tenant name, domain, or plan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredTenants.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No tenants found matching your search.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTenants.map((tenant) => (
                <Card key={tenant.tenantId} className="border-l-4 border-l-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{tenant.tenantName}</h3>
                          <Badge variant="outline">{tenant.plan}</Badge>
                          <Badge className={getStatusColor(tenant.status)}>
                            <span className="mr-1">{getStatusIcon(tenant.status)}</span>
                            {tenant.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{tenant.tenantDomain}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Current Amount</p>
                            <p className="font-semibold">{formatCurrency(tenant.amount)}/{tenant.billingCycle}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Revenue</p>
                            <p className="font-semibold">{formatCurrency(tenant.totalRevenue)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Current Period</p>
                            <p className="font-semibold">
                              {formatDate(tenant.currentPeriodStart)} - {formatDate(tenant.currentPeriodEnd)}
                            </p>
                          </div>
                          {tenant.trialEndsAt && (
                            <div>
                              <p className="text-muted-foreground">Trial Ends</p>
                              <p className="font-semibold text-blue-600">{formatDate(tenant.trialEndsAt)}</p>
                            </div>
                          )}
                          {tenant.lastInvoiceDate && (
                            <div>
                              <p className="text-muted-foreground">Last Invoice</p>
                              <p className="font-semibold">
                                {formatCurrency(tenant.lastInvoiceAmount || 0)} - {tenant.lastInvoiceStatus}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/super-admin/tenants/${tenant.tenantId}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/super-admin/billing/invoices?tenant=${tenant.tenantId}`)}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Invoices
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
