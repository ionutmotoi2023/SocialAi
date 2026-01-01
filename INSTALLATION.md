# 🚀 Social Media AI SaaS Platform - Setup & Installation Guide

## 📋 Quick Start Summary

This platform is now **~60% complete** with:
- ✅ Full authentication system
- ✅ Complete dashboard with stats
- ✅ OpenAI GPT-4 integration
- ✅ AI content generation
- ✅ Post creation and management
- ✅ Settings and AI configuration
- ⏳ Calendar/scheduling (pending)
- ⏳ LinkedIn publishing (pending)

---

## 🛠️ Installation Steps

### 1. Prerequisites

```bash
- Node.js 18+ (https://nodejs.org/)
- PostgreSQL 14+ (https://www.postgresql.org/)
- Git
- OpenAI API key (https://platform.openai.com/)
```

### 2. Clone and Install

```bash
# Clone repository
git clone <your-repo-url>
cd social-media-ai-saas

# Install dependencies
npm install
```

### 3. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your values
```

**Minimum Required Variables:**
```bash
# Database (required)
DATABASE_URL="postgresql://user:password@localhost:5432/socialmedia_ai"

# Authentication (required)
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI (required for AI features)
OPENAI_API_KEY="sk-your-openai-api-key-here"
```

**Optional Variables:**
```bash
# Other AI providers (optional)
ANTHROPIC_API_KEY="sk-ant-your-key"
GOOGLE_AI_API_KEY="your-google-key"

# LinkedIn (optional - for publishing)
LINKEDIN_CLIENT_ID="your-client-id"
LINKEDIN_CLIENT_SECRET="your-secret"

# AWS S3 (optional - for media storage)
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
AWS_S3_BUCKET="your-bucket"
```

### 4. Database Setup

```bash
# Create database
createdb socialmedia_ai

# OR using PostgreSQL CLI:
psql -U postgres
CREATE DATABASE socialmedia_ai;
\q

# Push schema to database
npx prisma db push

# Seed with demo data
npx prisma db seed
```

### 5. Start Development Server

```bash
npm run dev
```

**Visit:** http://localhost:3000

---

## 🔐 Demo Login Credentials

After seeding the database:

```
Email: admin@mindloop.ro
Password: (any password - demo mode accepts all passwords)
```

---

## 📂 Project Structure

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── content/           # AI content generation
│   │   ├── posts/             # Posts CRUD
│   │   ├── dashboard/         # Dashboard data
│   │   └── settings/          # Settings endpoints
│   ├── dashboard/             # Protected dashboard pages
│   │   ├── posts/            # Posts management
│   │   │   ├── create/       # Create post page
│   │   │   └── page.tsx      # Posts list
│   │   ├── settings/         # Settings page
│   │   └── page.tsx          # Dashboard home
│   ├── login/                # Login page
│   ├── register/             # Registration page
│   └── page.tsx              # Landing page
├── components/
│   ├── dashboard/            # Dashboard components
│   │   ├── sidebar.tsx       # Navigation sidebar
│   │   ├── header.tsx        # Dashboard header
│   │   ├── stats-cards.tsx   # Statistics cards
│   │   └── recent-activity.tsx
│   └── ui/                   # Reusable UI components
├── lib/
│   ├── ai/
│   │   └── openai.ts         # OpenAI integration
│   ├── auth.ts               # NextAuth configuration
│   ├── prisma.ts             # Database client
│   └── utils.ts              # Utilities
└── types/
    └── index.ts              # TypeScript types
```

---

## ✨ Features Implemented

### Authentication & Authorization
- ✅ NextAuth.js with credentials provider
- ✅ Login/Register pages
- ✅ Protected routes middleware
- ✅ Multi-tenant user management
- ✅ Role-based access control (SUPER_ADMIN, TENANT_ADMIN, EDITOR, VIEWER)

### Dashboard
- ✅ Sidebar navigation with workspace info
- ✅ Statistics cards (posts, scheduled, published, AI metrics)
- ✅ Recent activity feed
- ✅ Quick action buttons
- ✅ AI performance insights

### AI Content Generation
- ✅ OpenAI GPT-4 Turbo integration
- ✅ Configurable brand voice and tone
- ✅ Intelligent content generation
- ✅ Confidence scoring (0-100%)
- ✅ Hashtag extraction and optimization
- ✅ Content suggestions
- ✅ Generation time tracking

### Post Management
- ✅ Create posts with AI generation
- ✅ Edit and preview content
- ✅ Save as draft
- ✅ Posts listing with filtering
- ✅ Status badges (DRAFT, SCHEDULED, PUBLISHED)
- ✅ Multi-tenant post isolation

### Settings
- ✅ AI model selection (GPT-4 Turbo, GPT-4, GPT-3.5)
- ✅ Brand voice configuration
- ✅ Tone preference (professional, casual, etc.)
- ✅ Post length settings
- ✅ Hashtag strategy
- ✅ Emoji and CTA toggles

---

## 🚧 Features In Progress / Pending

### High Priority
- ⏳ Calendar view for scheduled posts
- ⏳ Post scheduling functionality
- ⏳ LinkedIn OAuth integration
- ⏳ LinkedIn publishing
- ⏳ Individual post edit page

### Medium Priority
- ⏳ Brand assets management (logo upload)
- ⏳ Media/image upload
- ⏳ Auto-pilot mode
- ⏳ Team management
- ⏳ Analytics dashboard

### Low Priority
- ⏳ Payment integration (Stripe)
- ⏳ Email notifications
- ⏳ Claude 3 integration
- ⏳ Gemini integration
- ⏳ AI learning visualization

---

## 🧪 Testing the Platform

### 1. Test Authentication
```bash
# Visit http://localhost:3000/login
# Login with: admin@mindloop.ro (any password)
```

### 2. Test AI Generation
```bash
# Navigate to Dashboard → Create Post
# Enter prompt: "Write a post about AI automation benefits"
# Click "Generate Content"
```

### 3. Test Settings
```bash
# Navigate to Dashboard → Settings
# Update Brand Voice
# Change AI preferences
# Save changes
```

### 4. Database Browser
```bash
# Open Prisma Studio
npx prisma studio
# Visit http://localhost:5555
```

---

## 📊 Available Scripts

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run build           # Build for production
npm run start           # Start production server

# Database
npx prisma studio       # Database GUI (port 5555)
npx prisma db push      # Push schema changes
npx prisma db seed      # Seed demo data
npx prisma generate     # Generate Prisma Client

# Code Quality
npm run lint            # ESLint check
npm run type-check      # TypeScript validation
```

---

## 🔧 Common Issues & Solutions

### Issue: Database Connection Error
```bash
# Check PostgreSQL is running
brew services list | grep postgres  # macOS
sudo service postgresql status      # Linux

# Test connection
psql -U postgres -d socialmedia_ai

# Reset database
npx prisma db push --force-reset
npx prisma db seed
```

### Issue: OpenAI API Error
```bash
# Verify API key is set
echo $OPENAI_API_KEY

# Check .env.local file
cat .env.local | grep OPENAI

# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Issue: Port Already in Use
```bash
# Find process on port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
npm run dev -- -p 3001
```

### Issue: NextAuth Secret Not Set
```bash
# Generate new secret
openssl rand -base64 32

# Add to .env.local
NEXTAUTH_SECRET="<generated-secret>"
```

---

## 🌐 Deployment to Railway

### Quick Deploy

1. **Push to GitHub**
```bash
git push origin main
```

2. **Connect to Railway**
- Visit https://railway.app
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose your repository

3. **Add PostgreSQL**
- Click "New"
- Select "Database"
- Choose "PostgreSQL"

4. **Environment Variables**
Add in Railway dashboard:
```bash
DATABASE_URL=${PGDATABASE_URL}
NEXTAUTH_SECRET=<your-secret>
NEXTAUTH_URL=https://your-app.railway.app
OPENAI_API_KEY=<your-key>
```

5. **Deploy**
- Railway auto-deploys on git push
- Check logs for any errors
- Visit your app URL

---

## 📈 Current Status

**Completion: ~60%**

| Feature | Status | Priority |
|---------|--------|----------|
| Authentication | ✅ 100% | High |
| Dashboard | ✅ 100% | High |
| AI Generation | ✅ 100% | High |
| Post Management | ✅ 80% | High |
| Settings | ✅ 100% | High |
| Calendar/Scheduling | ⏳ 0% | High |
| LinkedIn Publishing | ⏳ 0% | High |
| Brand Assets | ⏳ 0% | Medium |
| Auto-Pilot | ⏳ 0% | Medium |
| Analytics | ⏳ 0% | Medium |
| Team Management | ⏳ 0% | Medium |

---

## 🆘 Support

### Documentation
- [Full README](README.md)
- [Quick Start](QUICK_START.md)
- [Railway Deploy](RAILWAY_DEPLOY.md)
- [TODO Roadmap](TODO.md)

### Resources
- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **OpenAI**: https://platform.openai.com/docs
- **Railway**: https://docs.railway.app

### Contact
- **Company**: AI MINDLOOP SRL
- **Website**: https://mindloop.ro
- **Email**: support@mindloop.ro

---

**Made with ❤️ in Romania 🇷🇴**

**Ready to revolutionize social media automation! 🚀**
