# 🚀 Drive Sync Deployment Guide

## Prerequisites

Before deploying Drive Sync to production, ensure you have:

1. ✅ Google Cloud Console project with Drive API enabled
2. ✅ OAuth 2.0 credentials configured
3. ✅ Railway (or similar) hosting with PostgreSQL
4. ✅ Cloudinary account for media storage
5. ✅ OpenAI API key for GPT-4o

---

## Step 1: Google Cloud Console Setup

### 1.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Drive API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Drive API"
   - Click "Enable"

### 1.2 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: "SocialAI Drive Sync"
5. Authorized redirect URIs:
   ```
   https://your-app.up.railway.app/api/integrations/google-drive/callback
   http://localhost:3000/api/integrations/google-drive/callback (for testing)
   ```
6. Save **Client ID** and **Client Secret**

### 1.3 Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. User Type: External
3. App name: "SocialAI"
4. Support email: your-email@example.com
5. Scopes: Add the following scopes:
   - `https://www.googleapis.com/auth/drive.readonly`
   - `https://www.googleapis.com/auth/drive.metadata.readonly`
6. Test users: Add your email for testing

---

## Step 2: Railway Environment Variables

Add the following environment variables to your Railway project:

### Required Variables
```bash
# Google Drive OAuth
GOOGLE_DRIVE_CLIENT_ID=your_client_id_here
GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret_here

# OpenAI (for GPT-4o Vision)
OPENAI_API_KEY=sk-your-openai-api-key

# Cloudinary (for media storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Database (should already exist)
DATABASE_URL=postgresql://...

# NextAuth (should already exist)
NEXTAUTH_URL=https://your-app.up.railway.app
NEXTAUTH_SECRET=your-nextauth-secret

# CRON Secret (optional but recommended)
CRON_SECRET=your-secure-random-string
```

### How to Add Variables in Railway
1. Go to your project in Railway
2. Click on your service
3. Go to "Variables" tab
4. Click "New Variable"
5. Add each variable above
6. Click "Deploy" to apply changes

---

## Step 3: Database Migration

The database schema has already been updated via `prisma db push` during development.

If you need to manually apply migrations:

```bash
# Option 1: Via Railway CLI
railway run npx prisma db push

# Option 2: Via local connection
# Set DATABASE_URL in .env
npx prisma db push
```

### New Tables Created
- `cloud_storage_integrations` - Store OAuth tokens and sync status
- `synced_media` - Track files synced from Drive
- `media_groups` - Smart grouping of related media

### Modified Tables
- `auto_pilot_configs` - Added Drive sync settings
- `posts` - Added media group relationships

---

## Step 4: Verify CRON Jobs

CRON jobs are configured in `vercel.json` but need to be set up for Railway.

### Railway CRON Configuration

Railway doesn't support Vercel's cron format. Instead, we use node-cron (already implemented in `src/lib/cron/scheduler.ts`).

The CRON scheduler starts automatically when the app launches:

```typescript
// src/lib/cron/scheduler.ts
// Runs every 15 minutes for publish-scheduled
// Additional crons for Drive Sync will run at their intervals
```

### CRON Schedule Overview
| Job | Frequency | Endpoint | Purpose |
|-----|-----------|----------|---------|
| sync-cloud-storage | Every 15 min | `/api/cron/sync-cloud-storage` | Download new files from Drive |
| analyze-synced-media | Every 10 min | `/api/cron/analyze-synced-media` | AI analysis with GPT-4o Vision |
| group-media | Every 20 min | `/api/cron/group-media` | Smart grouping of related media |
| auto-generate-from-drive | Every 30 min | `/api/cron/auto-generate-from-drive` | Generate posts from groups |
| publish-scheduled | Every 15 min | `/api/cron/publish-scheduled` | Publish scheduled posts to LinkedIn |

### Manual Trigger (for testing)
You can manually trigger each CRON job by making a POST request:

```bash
# Sync new files
curl -X POST https://your-app.up.railway.app/api/cron/sync-cloud-storage \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Analyze media
curl -X POST https://your-app.up.railway.app/api/cron/analyze-synced-media \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Group media
curl -X POST https://your-app.up.railway.app/api/cron/group-media \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Generate posts
curl -X POST https://your-app.up.railway.app/api/cron/auto-generate-from-drive \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## Step 5: Testing the Integration

### 5.1 Connect Google Drive
1. Log in to your app
2. Go to Settings → Integrations
3. Click "Connect Google Drive"
4. Authorize in the OAuth popup
5. Verify connection status shows "Connected"

### 5.2 Upload Test Images
1. Create a folder in Google Drive (e.g., `/SocialAI`)
2. Upload 2-3 test images
3. Wait 15 minutes for sync CRON
4. Check Drive Media page to see synced files

### 5.3 Verify AI Analysis
1. Wait 10 minutes after sync
2. Go to Drive Media page
3. Check if status changed from "PENDING" to "ANALYZED"
4. View AI analysis results and suggested topics

### 5.4 Check Media Grouping
1. Wait 20 minutes after analysis
2. Go to Media Groups page
3. Verify that related images are grouped
4. Check grouping rules and confidence scores

### 5.5 Verify Post Generation
1. Enable Drive Sync in Auto-Pilot settings
2. Enable auto-analyze, auto-generate, auto-approve
3. Wait 30 minutes after grouping
4. Go to Calendar or Posts page
5. Verify post was created from media group

### 5.6 Test Publishing
1. Wait for scheduled time or manually publish
2. Check LinkedIn to see the post with images
3. Verify post status changed to "PUBLISHED"

---

## Step 6: Monitoring & Debugging

### Check CRON Logs
```bash
# Via Railway dashboard
# Go to your service → Deployments → View logs
# Filter by "CRON" or job name

# Example log patterns to look for:
# "[CRON] Starting sync-cloud-storage..."
# "[CRON] Synced 3 new files"
# "[CRON] Analysis complete for 3 media files"
# "[CRON] Created 2 media groups"
# "[CRON] Generated 1 post from media group"
```

### Common Issues & Solutions

#### Issue 1: OAuth Connection Fails
**Symptoms:** "Failed to connect Google Drive"
**Solutions:**
- Verify OAuth redirect URI matches exactly
- Check Google Cloud Console → OAuth consent screen is configured
- Ensure Drive API is enabled
- Clear browser cookies and try again

#### Issue 2: Files Not Syncing
**Symptoms:** Drive Media page is empty after upload
**Solutions:**
- Check CRON_SECRET is set correctly
- Verify sync CRON is running (check logs)
- Ensure refresh token is valid (check `cloud_storage_integrations` table)
- Try disconnecting and reconnecting Drive

#### Issue 3: AI Analysis Failing
**Symptoms:** Files stuck in "ANALYZING" status
**Solutions:**
- Verify OPENAI_API_KEY is valid
- Check OpenAI API quota/limits
- Review analyze CRON logs for errors
- Ensure images are accessible (Cloudinary URLs work)

#### Issue 4: No Posts Generated
**Symptoms:** Media groups exist but no posts created
**Solutions:**
- Verify Drive Sync is enabled in Auto-Pilot settings
- Check auto-generate is enabled
- Ensure confidence threshold is not too high (default 80%)
- Review generate CRON logs

#### Issue 5: CRON Jobs Not Running
**Symptoms:** No activity in logs
**Solutions:**
- Verify Railway deployment is successful
- Check if app is running (visit homepage)
- Ensure node-cron scheduler started (check startup logs)
- Try restarting the Railway service

---

## Step 7: Production Checklist

Before going live:

- [ ] All environment variables set in Railway
- [ ] Google OAuth consent screen approved (if needed)
- [ ] OAuth redirect URIs match production URL
- [ ] Database migrations applied
- [ ] CRON secret is secure and random
- [ ] OpenAI API key has sufficient quota
- [ ] Cloudinary storage has enough space
- [ ] Test Drive connection end-to-end
- [ ] Verify CRON jobs are running
- [ ] Check logs for errors
- [ ] Test with real user uploads
- [ ] Monitor first 24 hours closely

---

## Step 8: Performance Optimization (Optional)

### Reduce API Costs
1. **GPT-4o Vision**: Images are resized to 1024px max width
2. **Cloudinary**: Use optimized URLs for analysis
3. **Drive API**: Batch file listings when possible
4. **CRON timing**: Adjust intervals based on usage

### Scale CRON Jobs
If processing large volumes:
1. Increase CRON frequency for faster processing
2. Add batch size limits to prevent timeouts
3. Consider Redis queue for background jobs
4. Monitor memory usage and adjust

---

## Support & Resources

- **GitHub Issues:** https://github.com/ionutmotoi2023/SocialAi/issues
- **Google Drive API Docs:** https://developers.google.com/drive/api
- **OpenAI GPT-4o Docs:** https://platform.openai.com/docs
- **Cloudinary Docs:** https://cloudinary.com/documentation
- **Railway Docs:** https://docs.railway.app

---

**Last Updated:** 2026-01-03
**Version:** 1.0
**Status:** Production Ready ✅
