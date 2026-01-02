import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
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

    // Get query params
    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get('tenantId')

    // Build where clause
    const where = tenantId ? {
      subscription: {
        tenantId: tenantId
      }
    } : {}

    // Fetch invoices with tenant info
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        subscription: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                domain: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format response
    const formattedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      subscriptionId: invoice.subscriptionId,
      tenantId: invoice.subscription.tenantId,
      tenantName: invoice.subscription.tenant.name,
      tenantDomain: invoice.subscription.tenant.domain,
      amount: invoice.amount,
      status: invoice.status,
      dueDate: invoice.dueDate.toISOString(),
      paidAt: invoice.paidAt?.toISOString(),
      createdAt: invoice.createdAt.toISOString(),
      invoiceNumber: invoice.invoiceNumber,
      stripeInvoiceId: invoice.stripeInvoiceId,
    }))

    return NextResponse.json({
      success: true,
      invoices: formattedInvoices,
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Create manual invoice
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { subscriptionId, amount, dueDate, description } = body

    // Validate input
    if (!subscriptionId || !amount || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields: subscriptionId, amount, dueDate' },
        { status: 400 }
      )
    }

    // Verify subscription exists
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count()
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, '0')}`

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        subscriptionId,
        amount: parseFloat(amount),
        status: 'PENDING',
        dueDate: new Date(dueDate),
        invoiceNumber,
        // Optional fields
        ...(description && { description })
      },
      include: {
        subscription: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                domain: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        subscriptionId: invoice.subscriptionId,
        tenantId: invoice.subscription.tenantId,
        tenantName: invoice.subscription.tenant.name,
        tenantDomain: invoice.subscription.tenant.domain,
        amount: invoice.amount,
        status: invoice.status,
        dueDate: invoice.dueDate.toISOString(),
        paidAt: invoice.paidAt?.toISOString(),
        createdAt: invoice.createdAt.toISOString(),
        invoiceNumber: invoice.invoiceNumber,
      },
      message: 'Invoice created successfully'
    })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
