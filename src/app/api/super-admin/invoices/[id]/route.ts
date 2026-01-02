import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

    // Fetch invoice with details
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        subscription: {
          select: {
            plan: true,
            billingCycle: true,
            tenantId: true,
            tenant: {
              select: {
                name: true,
                domain: true,
                website: true,
                industry: true,
                logo: true,
              }
            }
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Format response
    const formattedInvoice = {
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
      description: invoice.description,
      subscription: {
        plan: invoice.subscription.plan,
        billingCycle: invoice.subscription.billingCycle,
      },
      tenant: invoice.subscription.tenant,
    }

    return NextResponse.json({
      success: true,
      invoice: formattedInvoice,
    })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params
    const body = await request.json()
    const { status } = body

    // Validate status
    const validStatuses = ['PENDING', 'PAID', 'OVERDUE', 'VOID']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Update invoice
    const updateData: any = { status }
    
    // If marking as paid, set paidAt
    if (status === 'PAID') {
      updateData.paidAt = new Date()
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        subscription: {
          select: {
            tenant: {
              select: {
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
        status: invoice.status,
        paidAt: invoice.paidAt?.toISOString(),
      },
      message: `Invoice ${status === 'PAID' ? 'marked as paid' : 'status updated'} successfully`
    })
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
