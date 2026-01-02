'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Mail,
  CreditCard
} from 'lucide-react'
import { toast } from 'sonner'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface InvoiceDetail {
  id: string
  subscriptionId: string
  tenantId: string
  tenantName: string
  tenantDomain: string
  amount: number
  status: string
  dueDate: string
  paidAt?: string
  createdAt: string
  invoiceNumber: string
  stripeInvoiceId?: string
  description?: string
  subscription: {
    plan: string
    billingCycle: string
  }
  tenant: {
    name: string
    domain: string
    website?: string
    industry?: string
    logo?: string
  }
}

export default function InvoiceDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const invoiceId = params.id as string

  const [loading, setLoading] = useState(true)
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      router.push('/dashboard')
      return
    }

    fetchInvoice()
  }, [session, status, router, invoiceId])

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/super-admin/invoices/${invoiceId}`)
      if (!response.ok) throw new Error('Failed to fetch invoice')
      const data = await response.json()
      setInvoice(data.invoice)
    } catch (error) {
      console.error('Error fetching invoice:', error)
      toast.error('Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsPaid = async () => {
    try {
      const response = await fetch(`/api/super-admin/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID' })
      })

      if (!response.ok) throw new Error('Failed to update invoice')
      
      toast.success('Invoice marked as paid')
      fetchInvoice()
    } catch (error) {
      console.error('Error updating invoice:', error)
      toast.error('Failed to update invoice')
    }
  }

  const handleVoidInvoice = async () => {
    if (!confirm('Are you sure you want to void this invoice? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/super-admin/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'VOID' })
      })

      if (!response.ok) throw new Error('Failed to void invoice')
      
      toast.success('Invoice voided')
      fetchInvoice()
    } catch (error) {
      console.error('Error voiding invoice:', error)
      toast.error('Failed to void invoice')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'OVERDUE': return 'bg-red-100 text-red-800'
      case 'VOID': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID': return <CheckCircle className="h-5 w-5" />
      case 'PENDING': return <Clock className="h-5 w-5" />
      case 'OVERDUE': return <AlertCircle className="h-5 w-5" />
      case 'VOID': return <XCircle className="h-5 w-5" />
      default: return <Clock className="h-5 w-5" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Invoice not found</p>
          <Button className="mt-4" onClick={() => router.push('/dashboard/super-admin/billing/invoices')}>
            Back to Invoices
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => router.push('/dashboard/super-admin/billing/invoices')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoices
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => console.log('Send reminder')}>
            <Mail className="h-4 w-4 mr-2" />
            Send Reminder
          </Button>
          <Button variant="outline" onClick={() => console.log('Download invoice')}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Invoice Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl">{invoice.invoiceNumber}</CardTitle>
              <CardDescription className="mt-2">
                Created on {formatDate(invoice.createdAt)}
              </CardDescription>
            </div>
            <Badge className={`${getStatusColor(invoice.status)} text-lg px-4 py-2`}>
              <span className="mr-2">{getStatusIcon(invoice.status)}</span>
              {invoice.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tenant Info */}
          <div>
            <h3 className="font-semibold mb-2">Bill To</h3>
            <div className="space-y-1">
              <p className="text-lg font-medium">{invoice.tenant.name}</p>
              <p className="text-sm text-muted-foreground">{invoice.tenant.domain}</p>
              {invoice.tenant.website && (
                <p className="text-sm text-muted-foreground">{invoice.tenant.website}</p>
              )}
              {invoice.tenant.industry && (
                <p className="text-sm text-muted-foreground">{invoice.tenant.industry}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Invoice Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice Number:</span>
                  <span className="font-medium">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date:</span>
                  <span className="font-medium">{formatDate(invoice.dueDate)}</span>
                </div>
                {invoice.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid On:</span>
                    <span className="font-medium text-green-600">{formatDate(invoice.paidAt)}</span>
                  </div>
                )}
                {invoice.stripeInvoiceId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stripe ID:</span>
                    <span className="font-medium font-mono text-xs">{invoice.stripeInvoiceId}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Subscription Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan:</span>
                  <Badge variant="outline">{invoice.subscription.plan}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Billing Cycle:</span>
                  <span className="font-medium capitalize">{invoice.subscription.billingCycle}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          {invoice.description && (
            <>
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">{invoice.description}</p>
              </div>
              <Separator />
            </>
          )}

          {/* Amount */}
          <div className="bg-accent/50 p-6 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Amount</span>
              <span className="text-3xl font-bold">{formatCurrency(invoice.amount)}</span>
            </div>
          </div>

          {/* Actions */}
          {invoice.status !== 'PAID' && invoice.status !== 'VOID' && (
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleVoidInvoice}>
                Void Invoice
              </Button>
              <Button onClick={handleMarkAsPaid}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Paid
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
