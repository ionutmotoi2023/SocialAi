# 🚀 Quick Start Guide - Social Media AI SaaS

Get your platform running in **5 minutes**! This guide will walk you through setting up the development environment.

---

## ⚡ **Prerequisites**

Before you start, make sure you have:

- ✅ **Node.js 18+** ([Download here](https://nodejs.org/))
- ✅ **PostgreSQL** ([Download here](https://www.postgresql.org/download/))
- ✅ **Git** ([Download here](https://git-scm.com/))
- ✅ **Code Editor** (VS Code recommended)

---

## 🛠️ **Step 1: Clone & Install**

```bash
# Clone the repository
git clone <your-repository-url>
cd social-media-ai-saas

# Install dependencies
npm install
```

---

## 🔧 **Step 2: Environment Setup**

```bash
# Copy environment template
cp .env.example .env.local

# Edit the file with your values
nano .env.local  # or use your preferred editor
```

### **Required Environment Variables:**

```bash
# Database (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/social_media_ai"

# Authentication Secret
NEXTAUTH_SECRET="your-secret-here"  # Generate: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# AI API Keys (get at least one)
OPENAI_API_KEY="sk-your-openai-key"
ANTHROPIC_API_KEY="sk-ant-your-anthropic-key"
GOOGLE_AI_API_KEY="your-google-ai-key"
```

### **Optional for MVP:**
```bash
# LinkedIn OAuth (for social posting)
LINKEDIN_CLIENT_ID="your-linkedin-client-id"
LINKEDIN_CLIENT_SECRET="your-linkedin-client-secret"

# AWS S3 (for file storage)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET="your-s3-bucket-name"
```

---

## 🗄️ **Step 3: Database Setup**

```bash
# Create database
createdb social_media_ai  # or use PostgreSQL GUI

# Run migrations
npx prisma migrate dev --name init

# Seed with sample data
npx prisma db seed
```

### **Verify Database:**
```bash
# Open Prisma Studio (database GUI)
npx prisma studio
```
This opens `http://localhost:5555` with a database browser.

---

## 🚀 **Step 4: Start Development**

```bash
# Start the development server
npm run dev
```

**Visit:** `http://localhost:3000`

You should see the landing page! 🎉

---

## 🎯 **Step 5: Test Core Features**

### **1. Health Check**
Visit: `http://localhost:3000/api/health`
Should return: `{"status": "healthy", ...}`

### **2. Landing Page**
Visit: `http://localhost:3000`
Should show the marketing site.

### **3. Database Browser**
```bash
npx prisma studio
```
Browse your tables and sample data.

---

## 🔧 **Troubleshooting**

### **Common Issues:**

**Database Connection Error:**
```bash
# Check PostgreSQL is running
pg_ctl status

# Reset database
npx prisma db push --force-reset
npx prisma db seed
```

**Missing AI API Keys:**
- Platform works without AI keys for UI testing
- Add at least OpenAI key for content generation
- Get keys from:
  - OpenAI: https://platform.openai.com/api-keys
  - Anthropic: https://console.anthropic.com/
  - Google AI: https://makersuite.google.com/app/apikey

**Port Already in Use:**
```bash
# Use different port
npm run dev -- -p 3001
```

**TypeScript Errors:**
```bash
# Check types
npm run type-check

# Fix auto-fixable issues
npm run lint -- --fix
```

---

## 📁 **Project Structure Overview**

```
social-media-ai-saas/
├── src/
│   ├── app/              # Next.js 14 app router
│   │   ├── api/          # API endpoints
│   │   ├── globals.css   # Global styles
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Landing page
│   ├── components/       # React components
│   │   └── ui/           # Reusable UI components
│   ├── lib/              # Utilities
│   │   ├── prisma.ts     # Database client
│   │   └── utils.ts      # Helper functions
│   └── types/            # TypeScript definitions
├── prisma/
│   └── schema.prisma     # Database schema
├── package.json          # Dependencies
├── tailwind.config.js    # Styling config
├── tsconfig.json         # TypeScript config
└── README.md             # Main documentation
```

---

## 🎮 **Next Steps**

### **Development Priorities:**

**Week 1: Authentication**
```bash
# Implement NextAuth.js
# Add login/register pages
# Set up protected routes
```

**Week 2: Dashboard**
```bash
# Create dashboard layout
# Add stats cards
# Implement basic navigation
```

**Week 3: AI Integration**
```bash
# Connect OpenAI API
# Build content generation
# Add confidence scoring
```

**Week 4: Content Management**
```bash
# Media upload functionality
# Post creation workflow
# Basic scheduling
```

### **Useful Commands:**

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Database
npx prisma studio       # Database GUI
npx prisma db push      # Push schema changes
npx prisma migrate dev  # Create migration
npx prisma db seed      # Seed data

# Code Quality
npm run lint            # Check code quality
npm run type-check      # Validate TypeScript
```

---

## 🆘 **Getting Help**

### **Documentation:**
- 📖 [Full README](README.md) - Complete documentation
- 🚂 [Railway Deploy](RAILWAY_DEPLOY.md) - Production deployment
- 📊 [API Docs](API_DOCS.md) - API reference
- 📋 [TODO](TODO.md) - Development roadmap

### **Common Resources:**
- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **Tailwind**: https://tailwindcss.com/docs
- **Railway**: https://docs.railway.app/

### **Support:**
- 📧 Email: support@mindloop.ro
- 🌐 Website: https://mindloop.ro
- 💼 Company: AI MINDLOOP SRL

---

## ✅ **Success Checklist**

- [ ] Repository cloned and dependencies installed
- [ ] Environment variables configured
- [ ] PostgreSQL database running
- [ ] Database migrated and seeded
- [ ] Development server started (`npm run dev`)
- [ ] Landing page loads at `http://localhost:3000`
- [ ] Health check passes at `/api/health`
- [ ] Prisma Studio accessible at port 5555

**All green? You're ready to build! 🚀**

---

**Made with ❤️ by AI MINDLOOP SRL | Romania 🇷🇴**

**Next:** Check out [TODO.md](TODO.md) for development priorities!