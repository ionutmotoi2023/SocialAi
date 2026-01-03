export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { sendContactFormEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema
const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  company: z.string().optional(),
  subject: z.string().min(1, 'Subject is required').default('General Inquiry'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json()

    // Validate input
    const validationResult = contactFormSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      )
    }

    const formData = validationResult.data

    // Get IP and User Agent for logging
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    // Check SMTP configuration
    const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD)

    if (smtpConfigured) {
      // Try to send email via SMTP
      console.log('Sending contact form email via SMTP:', {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
      })

      const result = await sendContactFormEmail(formData)

      if (result.success) {
        // Also save to database for backup
        await prisma.contactMessage.create({
          data: {
            name: formData.name,
            email: formData.email,
            company: formData.company || null,
            subject: formData.subject,
            message: formData.message,
            status: 'NEW',
            ipAddress,
            userAgent,
          },
        })

        return NextResponse.json({
          success: true,
          message: 'Your message has been sent successfully! We\'ll get back to you within 24 hours.',
          messageId: result.messageId,
        })
      } else {
        console.error('Failed to send email via SMTP:', result.error)
        // Fall through to database-only save
      }
    }

    // Fallback: Save to database only (when SMTP not configured or failed)
    console.log('Saving contact form to database (SMTP not available):', {
      name: formData.name,
      email: formData.email,
      subject: formData.subject,
    })

    const savedMessage = await prisma.contactMessage.create({
      data: {
        name: formData.name,
        email: formData.email,
        company: formData.company || null,
        subject: formData.subject,
        message: formData.message,
        status: 'NEW',
        ipAddress,
        userAgent,
      },
    })

    // Success response (database saved)
    return NextResponse.json({
      success: true,
      message: 'Your message has been received! We\'ll get back to you within 24 hours.',
      savedToDatabase: true,
      messageId: savedMessage.id,
      fallbackInfo: {
        email: 'office@mindloop.ro',
        phone: '+40726327192',
        note: 'For urgent matters, please call us directly.',
      },
    })

  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred. Please contact us directly.',
        fallbackEmail: 'office@mindloop.ro',
        fallbackPhone: '+40726327192',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
