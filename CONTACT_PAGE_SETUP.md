# Contact Form SMTP Configuration Guide

## ✅ Contact Page Created Successfully

### 📍 URLs:
- **Romanian**: https://socialai.mindloop.ro/contact
- **English**: https://socialai.mindloop.ro/contact/en

### 📞 Contact Information:
- **Email**: office@mindloop.ro
- **Phone**: +40 726 327 192
- **Location**: Bucharest, Romania

---

## 🔧 Railway SMTP Configuration Required

To enable email sending from the contact form, you need to configure SMTP variables in Railway:

### Environment Variables to Add:

```bash
# SMTP Configuration (Required for Contact Form)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
```

---

## 📧 Gmail SMTP Setup Instructions

### Option 1: Using Gmail Account

1. **Enable 2-Factor Authentication** on your Gmail account:
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it: "SocialAI Contact Form"
   - Copy the generated 16-character password

3. **Add to Railway**:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=office@mindloop.ro  # or your Gmail
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # 16-char app password
   ```

### Option 2: Using Office365/Outlook

```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=office@mindloop.ro
SMTP_PASSWORD=your-password
```

### Option 3: Using SendGrid (Recommended for Production)

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

---

## 🚀 Deployment Steps

### 1. Configure Variables in Railway:

```bash
# Navigate to Railway Dashboard
# Project: socialai-production
# Go to: Variables tab
# Add the following:

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=office@mindloop.ro
SMTP_PASSWORD=your-app-password
```

### 2. Redeploy Application:

Railway will automatically redeploy when you save new variables.

### 3. Test Contact Form:

1. Visit: https://socialai.mindloop.ro/contact
2. Fill out the form
3. Check:
   - ✅ You receive email at office@mindloop.ro
   - ✅ User receives confirmation email
   - ✅ Toast notification shows success

---

## 📋 Features Implemented

### ✅ Contact Page (Romanian):
- Professional design with gradient background
- Email card with mailto link
- Phone card with tel link: +40 726 327 192
- Office location information
- Business hours display
- Social media links
- Contact form with validation
- FAQ section
- CTA section
- Responsive footer

### ✅ Contact Page (English):
- Full translation at /contact/en
- Language switcher button
- Same features as Romanian version

### ✅ API Endpoint:
- `/api/contact/send` - POST endpoint
- Zod validation for form data
- SMTP email sending
- HTML email templates
- Auto-reply confirmation emails
- Error handling with fallback contact info

### ✅ Email Utility:
- `src/lib/email.ts`
- Nodemailer integration
- HTML email templates with styling
- Text fallback for emails
- Notification to office@mindloop.ro
- Confirmation to user

---

## 🧪 Testing Without SMTP (Fallback)

If SMTP is not configured, the form will:
1. Show error message
2. Provide fallback contact information:
   - Email: office@mindloop.ro
   - Phone: +40726327192

---

## 📱 Mobile Responsive

The contact page is fully responsive:
- ✅ Mobile (< 768px)
- ✅ Tablet (768px - 1024px)
- ✅ Desktop (> 1024px)

---

## 🎨 Design Features

- Gradient backgrounds
- Hover effects on cards
- Animated icons
- Loading states on form submission
- Toast notifications
- Professional color scheme (blue/purple gradient)

---

## 🔒 Security Features

- Input validation with Zod
- Email validation
- Rate limiting (recommended to add in production)
- Privacy policy link
- GDPR compliance notice

---

## 📊 Email Templates

### To Office (office@mindloop.ro):
```
Subject: [Contact Form] {user's subject}

Includes:
- User's name
- User's email (clickable)
- Company (if provided)
- Subject
- Message
- Timestamp
- Source: socialai.mindloop.ro
```

### To User (confirmation):
```
Subject: We received your message - AI MINDLOOP

Includes:
- Personalized greeting
- Message received confirmation
- Copy of their message
- 24-hour response time commitment
- Phone number for urgent matters
- Professional branding
```

---

## 🚨 Troubleshooting

### Form doesn't send:
1. Check Railway logs: `railway logs`
2. Verify SMTP variables are set
3. Test SMTP credentials manually
4. Check firewall/port 587 is open

### No confirmation email received:
1. Check spam folder
2. Verify SMTP_USER email exists
3. Check Railway logs for errors

### Gmail "Less secure app" error:
- Use App Password instead of regular password
- Enable 2FA first

---

## 📈 Next Steps (Optional Enhancements)

1. **Add Rate Limiting**:
   - Prevent spam
   - Use Redis for tracking

2. **Add Captcha**:
   - Google reCAPTCHA v3
   - Prevent bot submissions

3. **Add to CRM**:
   - Integration with HubSpot/Salesforce
   - Automatic lead creation

4. **Analytics**:
   - Track form submissions
   - Google Analytics events

5. **A/B Testing**:
   - Test different form layouts
   - Optimize conversion rate

---

## ✅ Deployment Complete

**Git Commit**: `feat: add professional contact page with SMTP email integration`

**Files Added**:
- `src/app/contact/page.tsx` (Romanian)
- `src/app/contact/en/page.tsx` (English)
- `src/app/api/contact/send/route.ts` (API endpoint)
- `src/lib/email.ts` (Email utility)

**Dependencies Added**:
- `nodemailer` - Email sending
- `@types/nodemailer` - TypeScript definitions

---

## 📞 Support

For any issues:
- Email: office@mindloop.ro
- Phone: +40 726 327 192
- GitHub: https://github.com/ionutmotoi2023/SocialAi

---

**Created**: 2026-01-03
**Status**: ✅ Deployed to Production
**Version**: 1.0.0
