import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is SUPER_ADMIN
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all subscriptions with tenant info
    const subscriptions = await prisma.subscription.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            domain: true,
            createdAt: true,
          }
        },
        invoices: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          select: {
            amount: true,
            status: true,
            createdAt: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate stats
    const stats = {
      totalRevenue: 0,
      mrr: 0,
      arr: 0,
      activeTenants: 0,
      trialTenants: 0,
      canceledTenants: 0,
      averageRevenuePerTenant: 0,
      churnRate: 0,
    }

    const tenantBillingData = []

    for (const sub of subscriptions) {
      // Count tenants by status
      if (sub.status === 'ACTIVE') stats.activeTenants++
      if (sub.status === 'TRIAL') stats.trialTenants++
      if (sub.status === 'CANCELED') stats.canceledTenants++

      // Calculate MRR (only from active and trial subscriptions)
      if (sub.status === 'ACTIVE' || sub.status === 'TRIAL') {
        const monthlyAmount = sub.billingCycle === 'monthly' ? sub.amount : sub.amount / 12
        stats.mrr += monthlyAmount
      }

      // Fetch total revenue from all invoices for this tenant
      const totalRevenue = await prisma.invoice.aggregate({
        where: {
          subscriptionId: sub.id,
          status: 'PAID'
        },
        _sum: {
          amount: true
        }
      })

      const tenantRevenue = totalRevenue._sum.amount || 0
      stats.totalRevenue += tenantRevenue

      // Build tenant billing data
      tenantBillingData.push({
        tenantId: sub.tenantId,
        tenantName: sub.tenant.name,
        tenantDomain: sub.tenant.domain,
        plan: sub.plan,
        status: sub.status,
        amount: sub.amount,
        billingCycle: sub.billingCycle,
        currentPeriodStart: sub.currentPeriodStart.toISOString(),
        currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
        trialEndsAt: sub.trialEndsAt?.toISOString(),
        canceledAt: sub.canceledAt?.toISOString(),
        lastInvoiceDate: sub.invoices[0]?.createdAt.toISOString(),
        lastInvoiceAmount: sub.invoices[0]?.amount,
        lastInvoiceStatus: sub.invoices[0]?.status,
        totalRevenue: tenantRevenue,
      })
    }

    // Calculate ARR
    stats.arr = stats.mrr * 12

    // Calculate average revenue per tenant
    const totalTenants = subscriptions.length
    stats.averageRevenuePerTenant = totalTenants > 0 ? stats.totalRevenue / totalTenants : 0

    // Calculate churn rate (canceled / total * 100)
    stats.churnRate = totalTenants > 0 ? (stats.canceledTenants / totalTenants) * 100 : 0

    return NextResponse.json({
      success: true,
      stats,
      tenants: tenantBillingData,
    })
  } catch (error) {
    console.error('Error fetching billing data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch billing data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
