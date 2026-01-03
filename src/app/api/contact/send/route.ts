export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { sendContactFormEmail } from '@/lib/email'
import { z } from 'zod'

// Validation schema
const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  company: z.string().optional(),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
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

    // Check SMTP configuration
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error('SMTP configuration missing')
      return NextResponse.json(
        { error: 'Email service not configured. Please contact office@mindloop.ro directly.' },
        { status: 503 }
      )
    }

    // Send email
    console.log('Sending contact form email:', {
      name: formData.name,
      email: formData.email,
      subject: formData.subject,
    })

    const result = await sendContactFormEmail(formData)

    if (!result.success) {
      console.error('Failed to send email:', result.error)
      return NextResponse.json(
        { 
          error: 'Failed to send email. Please try again or contact office@mindloop.ro directly.',
          fallbackEmail: 'office@mindloop.ro',
          fallbackPhone: '+40726327192',
        },
        { status: 500 }
      )
    }

    // Success response
    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully! We\'ll get back to you within 24 hours.',
      messageId: result.messageId,
    })

  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred. Please contact office@mindloop.ro directly.',
        fallbackEmail: 'office@mindloop.ro',
        fallbackPhone: '+40726327192',
      },
      { status: 500 }
    )
  }
}
