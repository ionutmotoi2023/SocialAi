# 🎯 POST-DEPLOYMENT SETUP GUIDE

**After Railway Build Succeeds, Follow These Steps:**

---

## ✅ STEP 1: Verify Railway Deployment

1. Go to Railway Dashboard: https://railway.app/
2. Open your project: **SocialAi**
3. Check deployment status - should show **"Deployed"** ✅
4. Click on service → **"View Logs"** to verify no errors
5. Note your app URL (should be like): 
   ```
   https://socialai-production-XXXX.up.railway.app
   ```

---

## ✅ STEP 2: Set Environment Variables in Railway

### Required Variables

Go to Railway → Your Service → **Variables** tab and add:

```bash
# NextAuth Configuration
NEXTAUTH_SECRET=<click "Generate" button or run: openssl rand -base64 32>
NEXTAUTH_URL=https://socialai-production-XXXX.up.railway.app

# OpenAI API Key (Get from: https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE

# CRON Security
CRON_SECRET=<click "Generate" button or run: openssl rand -base64 32>

# LinkedIn OAuth (See Step 3 below)
LINKEDIN_CLIENT_ID=<will get in Step 3>
LINKEDIN_CLIENT_SECRET=<will get in Step 3>
```

### Database URL
- **DATABASE_URL** - Should already be set automatically by Railway ✅
- Don't change this unless you know what you're doing

### After Setting Variables
Click **"Deploy"** or wait for auto-redeploy

---

## ✅ STEP 3: Create LinkedIn Application

### 3.1 Go to LinkedIn Developers
1. Visit: https://www.linkedin.com/developers/
2. Click **"Create app"**

### 3.2 Fill Application Details
```
App name: Social Media AI SaaS
Company: AI MINDLOOP SRL (or create your LinkedIn Page first)
Privacy policy URL: https://your-domain.com/privacy (use any for now)
App logo: Upload your logo
Legal agreement: Check the box
```

### 3.3 Configure OAuth Settings
1. Go to **"Auth"** tab
2. Add **Redirect URLs**:
   ```
   https://socialai-production-XXXX.up.railway.app/api/integrations/linkedin/callback
   ```
   
3. Request **OAuth 2.0 Scopes**:
   - ✅ `openid`
   - ✅ `profile`
   - ✅ `email`
   - ✅ `w_member_social` (required for posting)

### 3.4 Get Credentials
1. Go to **"Auth"** tab
2. Copy **Client ID** → Add to Railway as `LINKEDIN_CLIENT_ID`
3. Copy **Client Secret** → Add to Railway as `LINKEDIN_CLIENT_SECRET`
4. Click **"Update"** on LinkedIn
5. **Redeploy** on Railway

---

## ✅ STEP 4: Initialize Database

### Option A: Using Railway CLI (Recommended)
```bash
# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run npx prisma db push

# Seed demo data
railway run npx prisma db seed
```

### Option B: Using Railway Web Console
1. Go to Railway → Your Service
2. Click **"Deployments"** tab
3. Open latest deployment
4. Click **"View Logs"**
5. In the **"Shell"** section, run:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

### Expected Output
```
✅ Database schema synced
✅ Demo tenant created: AI MINDLOOP SRL
✅ Demo users created
✅ Demo posts created
✅ AI Config initialized
```

---

## ✅ STEP 5: First Login & Test

### 5.1 Access Your App
Visit: `https://socialai-production-XXXX.up.railway.app`

### 5.2 Demo Login
```
Email: admin@mindloop.ro
Password: (any password - demo mode allows any password)
```

### 5.3 Test Checklist

#### Test Authentication ✅
- [ ] Login successful
- [ ] Dashboard loads
- [ ] User profile visible
- [ ] Logout works

#### Test AI Generation ✅
- [ ] Go to **"Create Post"**
- [ ] Enter prompt: "Write about AI in social media"
- [ ] Click **"Generate with AI"**
- [ ] Content appears
- [ ] Confidence score shown
- [ ] Hashtags extracted
- [ ] Can save as draft

#### Test LinkedIn Integration ✅
- [ ] Go to **Settings → Integrations**
- [ ] Click **"Connect LinkedIn"**
- [ ] OAuth flow redirects to LinkedIn
- [ ] Authorize the app
- [ ] Returns to dashboard
- [ ] Shows "Connected" status
- [ ] Profile picture and name visible
- [ ] **"Test Connection"** button works

#### Test Media Upload ✅
- [ ] Go to **"Create Post"**
- [ ] Drag & drop an image
- [ ] Preview shows
- [ ] Can remove image
- [ ] Upload indicator works

#### Test Post Scheduling ✅
- [ ] Go to **Calendar** page
- [ ] Create a new post
- [ ] Set **Schedule Date & Time** (future)
- [ ] Status shows **"SCHEDULED"**
- [ ] Post appears on calendar

#### Test LinkedIn Publishing ✅
- [ ] Open a draft post
- [ ] Click **"Publish to LinkedIn"** button
- [ ] Wait for confirmation
- [ ] Check LinkedIn profile - post should appear!
- [ ] Post status changes to **"PUBLISHED"**
- [ ] LinkedIn URL saved

#### Test Auto-Pilot ✅
- [ ] Go to **Auto-Pilot** page
- [ ] Configure settings:
   - Number of posts: 3
   - Topics: Add 2-3 topics
   - Confidence threshold: 0.8
- [ ] Click **"Generate Posts"**
- [ ] Wait for bulk generation
- [ ] Check **Posts** page - should have 3 new posts
- [ ] Verify posts are in **"APPROVED"** or **"DRAFT"** status

#### Test Analytics ✅
- [ ] Go to **Analytics** page
- [ ] Check stats:
   - Total posts count
   - Published count
   - Avg engagement (mock data for now)
   - Time saved
   - AI accuracy
- [ ] Verify charts load

#### Test Team Management ✅
- [ ] Go to **Team** page
- [ ] Send invitation (use a real email)
- [ ] Check email for invite
- [ ] Accept invite (if possible)
- [ ] Verify member appears

---

## ✅ STEP 6: Verify CRON Job (Auto-Publishing)

### 6.1 Check Vercel Cron Configuration
Open: `vercel.json` in your repo
```json
{
  "crons": [{
    "path": "/api/cron/publish-scheduled",
    "schedule": "*/15 * * * *"
  }]
}
```

### 6.2 Test Manual Trigger
```bash
# Call the endpoint manually with CRON_SECRET
curl -X POST https://socialai-production-XXXX.up.railway.app/api/cron/publish-scheduled \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "published": 1,
  "failed": 0,
  "message": "Published 1 scheduled posts"
}
```

### 6.3 Test Automatic Publishing
1. Create a post with scheduled time = NOW + 5 minutes
2. Wait 15 minutes (next CRON run)
3. Refresh posts page
4. Post should be **"PUBLISHED"**
5. Check LinkedIn - post should appear!

---

## ✅ STEP 7: Create Your First Real User

### 7.1 Register New Account
1. Logout from demo account
2. Go to `/register`
3. Fill form:
   ```
   Name: Your Name
   Email: your-email@company.com
   Password: StrongPassword123!
   Company: Your Company Name
   ```
4. Click **"Create Account"**

### 7.2 Configure Your Workspace
1. Login with new account
2. Go to **Settings → AI Configuration**
3. Verify/Update:
   - AI Model: GPT-4 Turbo
   - Brand Voice: Write your brand voice
   - Tone: Select preference
   - Post Length: Medium
4. Save

### 7.3 Connect Your LinkedIn
1. Go to **Settings → Integrations**
2. Click **"Connect LinkedIn"**
3. Authorize with YOUR LinkedIn account
4. Test connection

---

## ✅ STEP 8: Production Checklist

### Security
- [ ] Change demo passwords
- [ ] Disable demo login (if desired)
- [ ] Enable HTTPS only
- [ ] Set secure cookies
- [ ] Add rate limiting (optional)

### Performance
- [ ] Enable caching
- [ ] Optimize images
- [ ] Add CDN (optional)
- [ ] Monitor response times

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Add uptime monitoring
- [ ] Configure alerts
- [ ] Monitor costs

### Business
- [ ] Set up payment processing (if needed)
- [ ] Add terms of service
- [ ] Add privacy policy
- [ ] Create pricing plans
- [ ] Marketing materials

---

## 🎯 CONGRATULATIONS!

Your **Social Media AI SaaS Platform** is now:

✅ **DEPLOYED** - Live on Railway
✅ **CONFIGURED** - All environment variables set
✅ **TESTED** - All features working
✅ **READY** - For real users!

---

## 📚 Quick Reference

### Important URLs
- **App**: https://socialai-production-XXXX.up.railway.app
- **Railway**: https://railway.app/
- **GitHub**: https://github.com/ionutmotoi2023/SocialAi
- **LinkedIn Dev**: https://www.linkedin.com/developers/

### Demo Credentials
- **Email**: admin@mindloop.ro
- **Password**: (any password)

### Documentation
- `FINAL_STATUS.md` - Complete overview
- `PROGRESS_STATUS.md` - Feature checklist
- `BUILD_FIXES.md` - All build fixes
- `LINKEDIN_INTEGRATION.md` - OAuth guide
- `CRON_SETUP.md` - Auto-publish setup
- `INSTALLATION.md` - Local setup

---

## 🆘 Troubleshooting

### Build Failed Again
1. Check Railway logs for exact error
2. Verify all TypeScript fixes are pushed
3. Run `npm run build` locally first
4. Check `BUILD_FIXES.md` for common issues

### LinkedIn OAuth Not Working
1. Verify redirect URI matches exactly
2. Check CLIENT_ID and CLIENT_SECRET
3. Ensure scopes are approved
4. Wait 5 minutes after updating LinkedIn app

### Database Connection Error
1. Check DATABASE_URL in Railway
2. Verify PostgreSQL service is running
3. Run `npx prisma db push` again
4. Check Railway database logs

### CRON Not Running
1. Verify CRON_SECRET is set
2. Check vercel.json configuration
3. Test manual trigger first
4. Check Railway logs for errors

---

## 📞 Need Help?

Contact: support@mindloop.ro
Company: AI MINDLOOP SRL | Romania 🇷🇴

---

**Made with ❤️ by AI MINDLOOP SRL**

**Status: READY FOR PRODUCTION! 🚀**
