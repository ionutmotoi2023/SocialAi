# 🚀 DEPLOYMENT CHECKLIST - Drive Sync Auto-Pilot

## Deployment Status: IN PROGRESS ⏳

---

## ✅ STEP 1: Code Deployment (COMPLETED)

- [x] ✅ Code merged to main branch
- [x] ✅ Pushed to GitHub repository
- [x] ✅ Railway auto-deployment triggered
- [x] ✅ Database schema updated (prisma db push completed)

**GitHub Repository:** https://github.com/ionutmotoi2023/SocialAi
**Latest Commit:** a9bc1bc - docs: add Drive Sync user guide

---

## ⏳ STEP 2: Railway Environment Variables

### Current Status: NEEDS CONFIGURATION ⚠️

### Required Variables for Drive Sync:

```bash
# === CRITICAL: Google Drive OAuth (NEW - Must Add) ===
GOOGLE_DRIVE_CLIENT_ID="[PENDING - See setup instructions below]"
GOOGLE_DRIVE_CLIENT_SECRET="[PENDING - See setup instructions below]"

# === Should Already Exist in Railway ===
DATABASE_URL="postgresql://postgres:HZlxTekzjERdCfxJSObKSiIOovpcfgSW@shortline.proxy.rlwy.net:38171/railway"
NEXTAUTH_URL="https://socialai-production-da70.up.railway.app"
NEXTAUTH_SECRET="[Should exist]"
OPENAI_API_KEY="[Should exist]"
CLOUDINARY_CLOUD_NAME="[Should exist]"
CLOUDINARY_API_KEY="[Should exist]"
CLOUDINARY_API_SECRET="[Should exist]"
CRON_SECRET="[Optional but recommended]"
```

### Action Required:
1. **Add GOOGLE_DRIVE_CLIENT_ID** - From Google Cloud Console
2. **Add GOOGLE_DRIVE_CLIENT_SECRET** - From Google Cloud Console

---

## ⏳ STEP 3: Google Cloud Console Setup

### 3.1 Create OAuth 2.0 Credentials

**Follow these steps:**

#### A. Access Google Cloud Console
```
URL: https://console.cloud.google.com/
```

#### B. Create/Select Project
- Project name: "SocialAI Drive Sync"
- Click CREATE

#### C. Enable Google Drive API
1. Go to: **APIs & Services → Library**
2. Search: "Google Drive API"
3. Click **ENABLE**

#### D. Configure OAuth Consent Screen
1. Go to: **APIs & Services → OAuth consent screen**
2. Select: **External**
3. Fill in:
   ```
   App name: SocialAI
   User support email: [your-email]
   Developer contact: [your-email]
   ```
4. **Scopes** - Add:
   - `../auth/drive.readonly`
   - `../auth/drive.metadata.readonly`
5. **Test users** - Add your email
6. Click **SAVE AND CONTINUE**

#### E. Create OAuth Client ID
1. Go to: **APIs & Services → Credentials**
2. Click: **CREATE CREDENTIALS → OAuth client ID**
3. Application type: **Web application**
4. Name: "SocialAI Drive Sync"
5. **Authorized redirect URIs** - Add BOTH:
   ```
   https://socialai-production-da70.up.railway.app/api/integrations/google-drive/callback
   http://localhost:3000/api/integrations/google-drive/callback
   ```
6. Click **CREATE**

#### F. Save Credentials
You'll receive:
- ✅ **Client ID** (something like: `123456-abc...xyz.apps.googleusercontent.com`)
- ✅ **Client Secret** (something like: `GOCSPX-abc...xyz`)

**⚠️ COPY THESE VALUES NOW!**

---

## ⏳ STEP 4: Add Variables to Railway

### Instructions:

1. **Go to Railway Dashboard:**
   ```
   https://railway.app/project/your-project-id
   ```

2. **Select your service** (socialai-production)

3. **Click "Variables" tab**

4. **Add New Variable #1:**
   ```
   Name: GOOGLE_DRIVE_CLIENT_ID
   Value: [paste from Google Cloud Console]
   ```

5. **Add New Variable #2:**
   ```
   Name: GOOGLE_DRIVE_CLIENT_SECRET
   Value: [paste from Google Cloud Console]
   ```

6. **Click "Deploy"** or wait for auto-redeploy

7. **Wait 2-5 minutes** for deployment to complete

### Verification:
- [ ] Variables appear in Railway dashboard
- [ ] Deployment status shows "Success" (green)
- [ ] No deployment errors in logs

---

## ⏳ STEP 5: Test Deployment

### 5.1 Access Application
```
URL: https://socialai-production-da70.up.railway.app
Login: admin@mindloop.ro / any password
```

### 5.2 Test Google Drive Connection

**Navigate to:** Settings → Integrations

**Expected UI:**
- [ ] See "Google Drive" card
- [ ] "Connect Google Drive" button visible
- [ ] Card shows description about Drive Sync

**Click "Connect Google Drive":**
- [ ] OAuth popup opens
- [ ] Google login screen appears
- [ ] Can select account
- [ ] Consent screen shows correct app name
- [ ] Permissions shown: "View files" and "View metadata"

**After authorization:**
- [ ] Popup closes automatically
- [ ] Status changes to "Connected"
- [ ] Shows your email address
- [ ] Shows folder path (default: /SocialAI)
- [ ] Shows "Last sync: Never" initially

### 5.3 Test Drive Sync Flow

**Upload Test Images:**
1. Go to Google Drive (drive.google.com)
2. Create folder "SocialAI"
3. Upload 2-3 test images (JPG/PNG)
4. Note the time

**Wait & Check (15 minutes):**
1. Go to: `/dashboard/drive-media`
2. Expected: Files appear with status "PENDING"

**Wait & Check (25 minutes):**
1. Refresh Drive Media page
2. Expected: Status changes to "ANALYZED"
3. Expected: AI description visible
4. Expected: Suggested topics shown

**Wait & Check (45 minutes):**
1. Go to: `/dashboard/media-groups`
2. Expected: Group created
3. Expected: Shows grouping rule
4. Expected: Media previews visible

**Wait & Check (75 minutes):**
1. Go to: `/dashboard/posts` or `/dashboard/calendar`
2. Expected: Post generated
3. Expected: Status is SCHEDULED or PENDING_APPROVAL
4. Expected: Post includes uploaded images

### 5.4 Check CRON Jobs

**View Railway Logs:**
```
Railway Dashboard → Deployments → Latest → View Logs
```

**Look for these patterns:**
```
[CRON] Starting sync-cloud-storage...
[CRON] Synced X new files from Google Drive
[CRON] Starting analyze-synced-media...
[CRON] Analyzed X media files successfully
[CRON] Starting group-media...
[CRON] Created X media groups
[CRON] Starting auto-generate-from-drive...
[CRON] Generated X posts from media groups
```

### Verification Checklist:
- [ ] Sync CRON logs appear every 15 min
- [ ] Analyze CRON logs appear every 10 min
- [ ] Group CRON logs appear every 20 min
- [ ] Generate CRON logs appear every 30 min
- [ ] No error messages in logs

---

## ⏳ STEP 6: Enable Auto-Pilot Settings

### Navigate to Auto-Pilot Page
```
URL: /dashboard/autopilot
```

### Configure Drive Sync Settings:

1. **Enable Drive Sync:**
   - [ ] Toggle "Enable Drive Sync" to ON
   - [ ] Should see green indicator

2. **Auto-Analyze:**
   - [ ] Toggle to ON (recommended)
   - [ ] Should show checkmark

3. **Auto-Generate:**
   - [ ] Toggle to ON (recommended)
   - [ ] Should show checkmark

4. **Auto-Approve:**
   - [ ] Leave OFF initially (for testing)
   - [ ] Can enable later after verifying quality

5. **Confidence Threshold:**
   - [ ] Set to 80% (default)
   - [ ] Adjust later based on results

6. **Verify Settings Saved:**
   - [ ] Should see success toast notification
   - [ ] Refresh page to confirm settings persist

---

## 📊 STEP 7: Monitor & Verify

### Day 1: Initial Monitoring (2-4 hours)

**Hour 0-1:**
- [ ] Upload 2-3 test images to Drive
- [ ] Verify Drive connection status
- [ ] Check Railway logs for sync activity

**Hour 1-2:**
- [ ] Check Drive Media page
- [ ] Verify files show "ANALYZED" status
- [ ] Review AI analysis quality

**Hour 2-3:**
- [ ] Check Media Groups page
- [ ] Verify grouping logic is correct
- [ ] Review confidence scores

**Hour 3-4:**
- [ ] Check Posts page
- [ ] Review generated post content
- [ ] Verify images are included
- [ ] Check scheduling

### Day 1: Issues to Watch For

❌ **If files don't sync:**
- Check Google Drive connection status
- Verify OAuth token is valid
- Check Railway logs for errors
- Try disconnect/reconnect Drive

❌ **If analysis fails:**
- Verify OPENAI_API_KEY is set
- Check OpenAI API quota
- Review Railway logs for AI errors

❌ **If grouping doesn't work:**
- Verify multiple images uploaded
- Check upload timing (same day helps)
- Review grouping rules in logs

❌ **If posts don't generate:**
- Verify Auto-Generate is ON
- Check confidence threshold isn't too high
- Review Railway logs for generate errors

---

## 🎯 STEP 8: Production Readiness

### After 24 Hours of Testing:

- [ ] ✅ 5+ images synced successfully
- [ ] ✅ AI analysis working correctly
- [ ] ✅ Grouping creates logical groups
- [ ] ✅ Post quality is acceptable
- [ ] ✅ No critical errors in logs
- [ ] ✅ CRON jobs running on schedule

### Enable Full Automation:

1. **Enable Auto-Approve:**
   - Go to Auto-Pilot page
   - Toggle "Auto-Approve" to ON
   - Posts with confidence ≥ 80% will auto-schedule

2. **Monitor Engagement:**
   - Track LinkedIn post performance
   - Adjust confidence threshold if needed
   - Refine topics in Auto-Pilot settings

3. **Regular Uploads:**
   - Upload images regularly to Drive
   - Maintain consistent content flow
   - Let AI handle the rest!

---

## 📋 Quick Reference

### Important URLs:
| Resource | URL |
|----------|-----|
| **Production App** | https://socialai-production-da70.up.railway.app |
| **Railway Dashboard** | https://railway.app |
| **Google Cloud Console** | https://console.cloud.google.com |
| **GitHub Repo** | https://github.com/ionutmotoi2023/SocialAi |

### Dashboard Pages:
| Page | URL | Purpose |
|------|-----|---------|
| **Integrations** | `/dashboard/settings/integrations` | Connect Drive |
| **Auto-Pilot** | `/dashboard/autopilot` | Configure settings |
| **Drive Media** | `/dashboard/drive-media` | View synced files |
| **Media Groups** | `/dashboard/media-groups` | View smart groups |
| **Posts** | `/dashboard/posts` | View generated posts |
| **Calendar** | `/dashboard/calendar` | View schedule |

### CRON Schedule:
| Job | Frequency | Purpose |
|-----|-----------|---------|
| sync-cloud-storage | Every 15 min | Download new files |
| analyze-synced-media | Every 10 min | AI analysis |
| group-media | Every 20 min | Smart grouping |
| auto-generate-from-drive | Every 30 min | Generate posts |
| publish-scheduled | Every 15 min | Publish to LinkedIn |

---

## 🎉 SUCCESS CRITERIA

### Deployment is successful when:

1. ✅ **Code deployed** - Railway shows "Success"
2. ✅ **Variables set** - GOOGLE_DRIVE_* added to Railway
3. ✅ **OAuth working** - Can connect Drive in UI
4. ✅ **Sync working** - Files appear in Drive Media
5. ✅ **Analysis working** - Status changes to ANALYZED
6. ✅ **Grouping working** - Groups appear in Media Groups
7. ✅ **Generation working** - Posts created automatically
8. ✅ **CRON jobs** - Running on schedule
9. ✅ **No errors** - Clean logs without critical issues

---

## 📞 Support & Documentation

**Setup Guides:**
- `GOOGLE_OAUTH_SETUP.md` - Detailed OAuth setup (10k+ words)
- `DRIVE_SYNC_DEPLOYMENT.md` - Technical deployment guide
- `DRIVE_SYNC_USER_GUIDE.md` - End-user guide
- `DRIVE_SYNC_IMPLEMENTATION.md` - Architecture reference

**Need Help?**
- Check Railway logs for errors
- Review troubleshooting sections in guides
- Verify all environment variables
- Test OAuth flow manually

---

## 🚀 CURRENT STATUS

**Last Updated:** 2026-01-03
**Deployment Phase:** READY FOR CONFIGURATION
**Next Action:** Configure Google OAuth credentials

**Progress:**
- [x] ✅ Code complete and merged
- [x] ✅ Documentation complete
- [x] ✅ Database schema updated
- [ ] ⏳ Google OAuth credentials configured
- [ ] ⏳ Railway variables added
- [ ] ⏳ End-to-end testing completed

---

**Ready to proceed with Google OAuth setup?** 
**Follow GOOGLE_OAUTH_SETUP.md for detailed instructions!** 🔐
