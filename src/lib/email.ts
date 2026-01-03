interface EmailOptions {
  to: string
  subject: string
  text: string
  html?: string
}

interface ContactFormData {
  name: string
  email: string
  company?: string
  subject: string
  message: string
}

// Send email utility with proper error handling
export async function sendEmail({ to, subject, text, html }: EmailOptions) {
  try {
    // Try to load nodemailer dynamically
    let nodemailer: any
    
    try {
      nodemailer = require('nodemailer')
    } catch (requireError) {
      console.error('Failed to require nodemailer:', requireError)
      return { 
        success: false, 
        error: 'Nodemailer module not available in current environment' 
      }
    }

    // Validate nodemailer loaded correctly
    if (!nodemailer || typeof nodemailer.createTransport !== 'function') {
      console.error('Nodemailer loaded but createTransport not available')
      return { 
        success: false, 
        error: 'Nodemailer module not properly initialized' 
      }
    }

    // Check SMTP configuration
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return {
        success: false,
        error: 'SMTP configuration missing (SMTP_HOST, SMTP_USER, or SMTP_PASSWORD not set)'
      }
    }

    // Create transporter
    const config = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    }

    console.log('Creating SMTP transporter with config:', {
      host: config.host,
      port: config.port,
      user: config.auth.user,
      hasPassword: !!config.auth.pass,
    })

    const transporter = nodemailer.createTransport(config)

    // Prepare email
    const mailOptions = {
      from: `"${process.env.NEXT_PUBLIC_APP_NAME || 'SocialAI'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html: html || text,
    }

    // Send email
    console.log('Sending email to:', to)
    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', info.messageId)
    
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email sending failed with error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown email error' 
    }
  }
}

// Send contact form notification to office
export async function sendContactFormEmail(data: ContactFormData) {
  const { name, email, company, subject, message } = data

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .field { margin-bottom: 20px; }
        .label { font-weight: bold; color: #667eea; display: block; margin-bottom: 5px; }
        .value { background: white; padding: 10px; border-radius: 5px; border-left: 3px solid #667eea; }
        .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin: 0;">🔔 New Contact Form Submission</h2>
        </div>
        <div class="content">
          <div class="field">
            <span class="label">👤 Name:</span>
            <div class="value">${name}</div>
          </div>
          
          <div class="field">
            <span class="label">📧 Email:</span>
            <div class="value"><a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a></div>
          </div>
          
          ${company ? `
          <div class="field">
            <span class="label">🏢 Company:</span>
            <div class="value">${company}</div>
          </div>
          ` : ''}
          
          <div class="field">
            <span class="label">📝 Subject:</span>
            <div class="value">${subject}</div>
          </div>
          
          <div class="field">
            <span class="label">💬 Message:</span>
            <div class="value" style="white-space: pre-wrap;">${message}</div>
          </div>
        </div>
        
        <div class="footer">
          <p>This email was sent from the contact form at <a href="${process.env.NEXTAUTH_URL}" style="color: #667eea;">socialai.mindloop.ro</a></p>
          <p>AI MINDLOOP SRL • Bucharest, Romania</p>
        </div>
      </div>
    </body>
    </html>
  `

  const textContent = `
New Contact Form Submission

Name: ${name}
Email: ${email}
${company ? `Company: ${company}\n` : ''}Subject: ${subject}

Message:
${message}

---
Sent from socialai.mindloop.ro
  `

  // Send to office email
  console.log('Attempting to send email to office@mindloop.ro')
  const result = await sendEmail({
    to: 'office@mindloop.ro',
    subject: `[Contact Form] ${subject}`,
    text: textContent,
    html: htmlContent,
  })

  // Send confirmation to user only if office email succeeded
  if (result.success) {
    console.log('Office email sent successfully, sending confirmation to user')
    const confirmationHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .checkmark { font-size: 48px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="checkmark">✅</div>
            <h2 style="margin: 0;">Message Received!</h2>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Thank you for contacting <strong>AI MINDLOOP SRL</strong>. We've received your message and will get back to you within 24 hours.</p>
            <p><strong>Your message:</strong></p>
            <p style="background: white; padding: 15px; border-radius: 5px; border-left: 3px solid #667eea; white-space: pre-wrap;">${message}</p>
            <p>If you have any urgent questions, feel free to call us at <strong>+40726327192</strong>.</p>
            <p style="margin-top: 30px;">Best regards,<br><strong>AI MINDLOOP Team</strong></p>
          </div>
        </div>
      </body>
      </html>
    `

    await sendEmail({
      to: email,
      subject: 'We received your message - AI MINDLOOP',
      text: `Hi ${name},\n\nThank you for contacting AI MINDLOOP SRL. We've received your message and will get back to you within 24 hours.\n\nBest regards,\nAI MINDLOOP Team`,
      html: confirmationHtml,
    })
  } else {
    console.log('Office email failed, skipping user confirmation:', result.error)
  }

  return result
}
