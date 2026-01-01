# 🚂 Railway Deployment Guide

Deploy your Social Media AI SaaS to production in **under 10 minutes** using Railway's powerful platform.

---

## 🎯 **Why Railway?**

- ✅ **One-click PostgreSQL** database provisioning
- ✅ **Automatic SSL** certificates and custom domains
- ✅ **Git-based deployment** with zero DevOps setup
- ✅ **Auto-scaling** based on traffic
- ✅ **Affordable pricing** starting at $5/month
- ✅ **Built-in monitoring** and logging

---

## 📋 **Pre-Deployment Checklist**

Before deploying, ensure you have:

- [ ] **GitHub repository** with your code
- [ ] **Railway account** ([Sign up here](https://railway.app/))
- [ ] **Environment variables** ready (see section below)
- [ ] **AI API keys** (OpenAI, Anthropic, or Google)
- [ ] **AWS S3 bucket** (optional but recommended)

---

## 🚀 **Method 1: One-Click Deploy (Recommended)**

### **Step 1: Connect GitHub**
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `social-media-ai-saas` repository

### **Step 2: Add Database**
Railway will automatically detect you need PostgreSQL:
1. Click **"Add PostgreSQL"** when prompted
2. Railway provisions a managed database instantly
3. `DATABASE_URL` is automatically set

### **Step 3: Configure Environment Variables**
In Railway dashboard → **Variables** tab, add:

```bash
# Authentication (REQUIRED)
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=https://your-app-name.railway.app

# AI APIs (at least one required)
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
GOOGLE_AI_API_KEY=your-google-ai-key

# LinkedIn OAuth (optional for MVP)
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# AWS S3 Storage (optional for MVP)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-s3-bucket-name

# Production settings
NODE_ENV=production
PORT=3000
```

### **Step 4: Deploy**
1. Click **"Deploy"** button
2. Railway builds and deploys automatically
3. Get your live URL: `https://your-app-name.railway.app`

**🎉 That's it! Your app is live!**

---

## ⚙️ **Method 2: Railway CLI (Advanced)**

### **Install Railway CLI:**
```bash
npm install -g @railway/cli

# Login to Railway
railway login
```

### **Deploy from terminal:**
```bash
# In your project directory
railway init

# Link to existing project or create new
railway link

# Add PostgreSQL database
railway add --plugin postgresql

# Set environment variables
railway variables set NEXTAUTH_SECRET="your-secret"
railway variables set OPENAI_API_KEY="your-key"
# ... add other variables

# Deploy
railway up
```

---

## 🔧 **Environment Variables Deep Dive**

### **🔐 Generate Secrets:**
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Or use online generator
# https://generate-secret.vercel.app/32
```

### **🤖 AI API Keys:**

**OpenAI (Recommended):**
1. Visit: https://platform.openai.com/api-keys
2. Create new API key
3. Add to Railway: `OPENAI_API_KEY=sk-...`

**Anthropic Claude:**
1. Visit: https://console.anthropic.com/
2. Create API key
3. Add to Railway: `ANTHROPIC_API_KEY=sk-ant-...`

**Google AI:**
1. Visit: https://makersuite.google.com/app/apikey
2. Create API key
3. Add to Railway: `GOOGLE_AI_API_KEY=...`

### **🔗 LinkedIn OAuth:**
1. Go to: https://developer.linkedin.com/
2. Create new app
3. Get Client ID and Secret
4. Set redirect URI: `https://your-app.railway.app/api/auth/callback/linkedin`

### **☁️ AWS S3 Setup:**
```bash
# Create S3 bucket
aws s3 mb s3://your-saas-media-bucket

# Create IAM user with S3 permissions
# Get Access Key ID and Secret Access Key
```

---

## 🗄️ **Database Management**

### **Access Railway PostgreSQL:**
```bash
# Get connection string
railway variables

# Connect with psql
railway connect postgresql

# Or use GUI tools like pgAdmin with connection details
```

### **Run Migrations on Railway:**
```bash
# Connect to Railway environment
railway shell

# Run Prisma migrations
npx prisma migrate deploy

# Seed production database (optional)
npx prisma db seed
```

### **Database Backups:**
Railway automatically creates daily backups:
- **Retention**: 7 days for Starter, 30 days for Pro
- **Point-in-time recovery** available
- **Manual backups** via Railway CLI or dashboard

---

## 📊 **Monitoring & Maintenance**

### **Built-in Monitoring:**
Railway provides:
- ✅ **CPU/Memory usage** graphs
- ✅ **Response time** metrics  
- ✅ **Error rate** tracking
- ✅ **Database performance** stats

### **Logs Access:**
```bash
# View live logs
railway logs

# Follow logs in real-time
railway logs --follow

# Filter by service
railway logs --service web
```

### **Health Monitoring:**
Your app includes health check endpoint:
- **URL**: `https://your-app.railway.app/api/health`
- **Returns**: Service status and dependencies
- **Use for**: External monitoring (Pingdom, UptimeRobot)

---

## 🌐 **Custom Domain Setup**

### **Add Your Domain:**
1. **Railway Dashboard** → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter: `your-domain.com`
4. Update DNS records:
   ```
   Type: CNAME
   Name: @
   Value: your-app.railway.app
   ```
5. Railway auto-provisions SSL certificate

### **Environment Update:**
```bash
# Update NEXTAUTH_URL to your custom domain
NEXTAUTH_URL=https://your-domain.com
```

---

## 💰 **Pricing & Scaling**

### **Railway Plans:**

**🎯 Starter Plan - $5/month:**
- 500h compute time
- 1GB RAM
- 1GB disk storage
- **Perfect for**: MVP, small teams

**🚀 Pro Plan - $20/month:**
- Unlimited compute
- 8GB RAM included
- 10GB disk storage
- Priority support
- **Perfect for**: Production, growing business

**🏢 Enterprise - Custom:**
- Dedicated resources
- SLA guarantees
- Advanced security
- **Perfect for**: Large scale, compliance needs

### **Cost Optimization:**
```bash
# Monitor usage
railway usage

# Scale down during low-traffic periods
railway environment variables set RAILWAY_SCALE_DOWN=true

# Use environment-based scaling
```

---

## 🔒 **Security Best Practices**

### **Environment Security:**
```bash
# Use Railway's secret management
railway variables set --secret DATABASE_PASSWORD="secure-password"

# Never commit secrets to git
echo ".env*" >> .gitignore

# Rotate API keys regularly
```

### **Database Security:**
- ✅ **Encrypted connections** (SSL by default)
- ✅ **Regular backups** with encryption
- ✅ **Network isolation** in Railway VPC
- ✅ **Access logs** for audit trails

### **Application Security:**
- ✅ **HTTPS only** (enforced by Railway)
- ✅ **JWT token validation** in API routes
- ✅ **CORS policies** configured
- ✅ **Rate limiting** (implement in middleware)

---

## 🚨 **Troubleshooting**

### **Common Deployment Issues:**

**Build Failures:**
```bash
# Check build logs
railway logs --deployment

# Common fixes:
# 1. Ensure Node.js version in package.json
# 2. Check TypeScript errors
# 3. Verify all dependencies installed
```

**Database Connection Issues:**
```bash
# Verify DATABASE_URL is set
railway variables

# Test connection
railway shell
npx prisma db push
```

**Environment Variable Problems:**
```bash
# List all variables
railway variables

# Test in Railway shell
railway shell
echo $OPENAI_API_KEY
```

### **Performance Issues:**

**Slow Response Times:**
- Check Railway metrics for CPU/memory usage
- Consider upgrading to Pro plan for more resources
- Optimize database queries with Prisma

**Database Performance:**
```bash
# Monitor slow queries
railway logs --service postgresql

# Add database indexes for frequent queries
npx prisma db push
```

---

## 📈 **Post-Deployment Setup**

### **1. Verify Deployment:**
```bash
# Health check
curl https://your-app.railway.app/api/health

# Database connection
curl https://your-app.railway.app/api/auth/csrf
```

### **2. Setup Monitoring:**
- Add uptime monitoring (Pingdom, UptimeRobot)
- Configure error tracking (Sentry)
- Set up analytics (Google Analytics)

### **3. Configure CI/CD:**
Railway auto-deploys on git push to main branch:
```bash
# Setup branch protection
# Add staging environment for testing
railway environment create staging
```

---

## ✅ **Deployment Checklist**

**Pre-Deploy:**
- [ ] Code pushed to GitHub
- [ ] Railway account created
- [ ] Environment variables prepared
- [ ] AI API keys obtained

**Deploy:**
- [ ] Railway project created
- [ ] PostgreSQL database added
- [ ] Environment variables set
- [ ] Successful deployment

**Post-Deploy:**
- [ ] Health check passes
- [ ] Database migrations run
- [ ] Custom domain configured (optional)
- [ ] Monitoring setup
- [ ] SSL certificate active

---

## 🆘 **Support**

**Railway Documentation:**
- 📖 [Railway Docs](https://docs.railway.app/)
- 🎥 [Video Tutorials](https://railway.app/help)
- 💬 [Discord Community](https://discord.gg/railway)

**Project Support:**
- 📧 Email: support@mindloop.ro
- 🌐 Website: https://mindloop.ro
- 💼 Company: AI MINDLOOP SRL

---

**🎉 Congratulations! Your Social Media AI SaaS is now live on Railway!**

**Next Steps:**
- Test all functionality in production
- Set up user onboarding flow
- Configure payment processing (Stripe)
- Launch marketing campaigns

**Made with ❤️ by AI MINDLOOP SRL | Romania 🇷🇴**