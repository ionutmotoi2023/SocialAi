# Stripe Webhook Configuration

This document explains how to configure Stripe webhooks for the SocialAI platform.

## What are webhooks?

Webhooks allow Stripe to notify your application when events happen (e.g., successful payment, failed payment, subscription cancellation). This ensures your database stays in sync with Stripe.

---

## Events Handled

Our webhook handler (`/api/webhooks/stripe`) listens for these events:

1. **checkout.session.completed**
   - Triggered when user completes payment on Stripe Checkout
   - Updates subscription status to ACTIVE
   - Links Stripe Customer ID and Subscription ID

2. **invoice.paid**
   - Triggered when a subscription invoice is paid
   - Creates invoice record in database
   - Status: PAID

3. **invoice.payment_failed**
   - Triggered when payment fails (e.g., expired card)
   - Updates subscription status to PAST_DUE
   - Should trigger email notification (TODO)

4. **customer.subscription.updated**
   - Triggered when subscription changes (plan upgrade, billing cycle, etc.)
   - Syncs subscription details from Stripe

5. **customer.subscription.deleted**
   - Triggered when subscription is cancelled
   - Updates status to CANCELLED

---

## Setup Instructions

### 1. Get your webhook endpoint URL

**Production:**
```
https://socialai.mindloop.ro/api/webhooks/stripe
```

**Local testing (using Stripe CLI):**
```
http://localhost:3000/api/webhooks/stripe
```

### 2. Configure webhook in Stripe Dashboard

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Enter your endpoint URL (see above)
4. Select events to listen to:
   - ✅ `checkout.session.completed`
   - ✅ `invoice.paid`
   - ✅ `invoice.payment_failed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (starts with `whsec_...`)

### 3. Add signing secret to environment variables

**Railway (production):**
1. Go to Railway project → Variables
2. Add:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
3. Redeploy

**Local (.env):**
```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Testing Webhooks Locally

Use Stripe CLI to forward events to your local server:

### 1. Install Stripe CLI
```bash
brew install stripe/stripe-cli/stripe
# or
scoop install stripe
```

### 2. Login to Stripe
```bash
stripe login
```

### 3. Forward webhooks to localhost
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will:
- Show webhook signing secret (copy to `.env` as `STRIPE_WEBHOOK_SECRET`)
- Forward all Stripe events to your local server
- Display real-time event logs

### 4. Trigger test events
```bash
# Test checkout completed
stripe trigger checkout.session.completed

# Test invoice paid
stripe trigger invoice.paid

# Test payment failed
stripe trigger invoice.payment_failed
```

---

## Verifying Webhooks

### Check logs:
- **Railway**: Go to project → Deployments → Logs
- **Local**: Check terminal running `npm run dev`

Look for:
```
[Webhook] Received event: checkout.session.completed
[Webhook] Subscription abc123 activated for tenant xyz789
```

### Test with Stripe Dashboard:
1. Complete a test payment using test card `4242 4242 4242 4242`
2. Go to Stripe Dashboard → Developers → Webhooks → Your endpoint
3. Click **"Send test webhook"**
4. Select event type → Send
5. Check response status (should be 200 OK)

---

## Troubleshooting

### ❌ "Webhook signature verification failed"
- **Cause**: Wrong `STRIPE_WEBHOOK_SECRET`
- **Fix**: Copy correct secret from Stripe Dashboard → Webhooks → Your endpoint → Signing secret

### ❌ "Webhook secret not configured"
- **Cause**: `STRIPE_WEBHOOK_SECRET` not set in env vars
- **Fix**: Add to Railway variables or `.env`

### ❌ "Subscription not found"
- **Cause**: Webhook received for subscription not in DB
- **Fix**: Ensure checkout session includes metadata:
  ```typescript
  metadata: {
    tenantId: 'xxx',
    subscriptionId: 'yyy'
  }
  ```

### ❌ Webhook timeout (after 30s)
- **Cause**: Handler taking too long
- **Fix**: Optimize database queries, consider background jobs for heavy tasks

---

## Security Notes

1. ✅ Always verify webhook signature
2. ✅ Use HTTPS in production (Railway provides this automatically)
3. ✅ Keep `STRIPE_WEBHOOK_SECRET` private
4. ❌ Never expose webhook endpoint without signature verification
5. ❌ Don't trust data without signature check

---

## What happens when webhook is missed?

If your server is down when Stripe sends a webhook:
- Stripe will retry for 3 days with exponential backoff
- You can manually replay events from Stripe Dashboard
- Subscription data can be manually synced using Stripe API

---

## Next Steps

1. ✅ Configure webhook in Stripe Dashboard
2. ✅ Add `STRIPE_WEBHOOK_SECRET` to Railway
3. ✅ Test with Stripe CLI locally
4. ✅ Verify production webhook receives events
5. 🔄 Add email notifications for failed payments (TODO)
6. 🔄 Add retry logic for failed webhook handlers (TODO)
