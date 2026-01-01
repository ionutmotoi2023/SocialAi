# Social Media AI SaaS Platform

🚀 **A modern SaaS platform for AI-powered social media automation with multi-tenant architecture**

Built by **AI MINDLOOP SRL** - Made in Romania 🇷🇴

---

## 🎯 **Overview**

This is a comprehensive SaaS platform that automates social media content creation using advanced AI models (GPT-4, Claude 3, Gemini Pro). Features include:

- **Multi-tenant architecture** with role-based access control
- **AI-powered content generation** with continuous learning
- **Auto-pilot mode** for 100% automated posting
- **Logo watermarking** and brand asset management
- **LinkedIn integration** with OAuth 2.0
- **Smart scheduling** and calendar management
- **Machine learning** from user feedback

---

## 🏗️ **Architecture**

### **Stack Overview**
- **Frontend**: Next.js 14 + React + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Prisma ORM
- **Database**: PostgreSQL with Row-Level Security (RLS)
- **Hosting**: Railway Platform (recommended)
- **Storage**: AWS S3 for media and brand assets
- **AI**: OpenAI GPT-4, Anthropic Claude 3, Google Gemini Pro

### **Multi-Tenant Design**
- Logical separation using `tenantId` in all data models
- Row-Level Security (RLS) for data isolation
- Tenant-specific AI configurations and learning models
- RBAC with 4 roles: Super Admin, Tenant Admin, Editor, Viewer

---

## 📊 **Database Schema**

### **Core Tables:**
- `tenants` - Company/organization data
- `users` - User accounts with RBAC
- `ai_configs` - AI model configurations per tenant
- `brand_assets` - Logos, watermarks, templates
- `posts` - Generated content with AI metadata
- `ai_learning_data` - ML feedback loop data
- `content_sources` - RSS, competitor monitoring
- `linkedin_integrations` - OAuth tokens and settings

### **Features:**
- **Multi-tenant isolation** with `tenantId` foreign keys
- **AI tracking** with confidence scores and generation metadata
- **Learning engine** that captures user edits and preferences
- **Brand management** with watermarking settings

---

## 🚀 **Quick Start**

### **Prerequisites:**
- Node.js 18+ and npm/yarn
- PostgreSQL database
- AWS S3 bucket (for media storage)
- AI API keys (OpenAI, Anthropic, Google)

### **Installation:**

```bash
# Clone repository
git clone <your-repo-url>
cd social-media-ai-saas

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Setup database
npx prisma migrate dev
npx prisma db seed

# Start development server
npm run dev
```

Visit `http://localhost:3000`

---

## 🔧 **Environment Variables**

Create `.env.local` from `.env.example`:

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/social_media_ai_saas"

# Authentication
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# AI APIs
OPENAI_API_KEY="sk-your-openai-key"
ANTHROPIC_API_KEY="sk-ant-your-anthropic-key"
GOOGLE_AI_API_KEY="your-google-ai-key"

# LinkedIn OAuth
LINKEDIN_CLIENT_ID="your-linkedin-client-id"
LINKEDIN_CLIENT_SECRET="your-linkedin-client-secret"

# AWS S3
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET="your-s3-bucket-name"
```

---

## 🚂 **Railway Deployment**

### **One-Click Deploy:**

1. **Connect GitHub**: Link your repository to Railway
2. **Add Database**: Railway will auto-provision PostgreSQL
3. **Set Variables**: Add environment variables in Railway dashboard
4. **Deploy**: Automatic deployment on git push

### **Railway Configuration:**
- Uses `railway.json` for deployment settings
- PostgreSQL database with automatic backups
- Custom domain support with SSL
- Auto-scaling based on usage

### **Cost Estimates:**
- **Starter**: $5/month (hobby/development)
- **Pro**: $20/month (production ready)
- **Enterprise**: Custom pricing for high-scale

---

## 🤖 **AI Features**

### **Supported Models:**
- **GPT-4 Turbo**: Creative content generation
- **Claude 3 Opus**: Long-form content and brand voice
- **Gemini Pro**: Cost-effective option

### **AI Capabilities:**
- **Content Generation**: Text, captions, hashtags
- **Image Analysis**: Extract context from uploaded media
- **Brand Voice Learning**: Adapts to company style
- **Confidence Scoring**: Quality assessment (0-100%)
- **Auto-pilot Mode**: 100% automated posting

### **Learning Engine:**
- **Pattern Recognition**: Learns from user edits
- **Feedback Loop**: Improves accuracy over time
- **A/B Testing**: Optimizes content performance
- **Personalization**: Tenant-specific AI models

---

## 🎨 **Brand Management**

### **Logo Integration:**
- **Upload Support**: PNG/SVG with transparency
- **Automatic Watermarking**: Configurable position and opacity
- **Smart Positioning**: AI avoids overlapping key elements
- **Multiple Versions**: Light/dark theme variants

### **Brand Assets:**
- **Asset Library**: Centralized brand resource storage
- **Template System**: Reusable design templates
- **Brand Guidelines**: Automated compliance checking
- **Version Control**: Asset history and rollback

---

## 📅 **Content Management**

### **Creation Workflow:**
1. **Media Upload**: Images/videos with drag-and-drop
2. **AI Analysis**: Content understanding and context extraction
3. **Text Generation**: AI-powered captions with brand voice
4. **Logo Integration**: Automatic watermarking (optional)
5. **Review & Approval**: User feedback and modifications
6. **Scheduling**: Calendar-based posting management

### **Auto-pilot Mode:**
- **Bulk Generation**: Create multiple posts simultaneously
- **Confidence Filtering**: Only approve high-quality content
- **Smart Scheduling**: Optimal posting times
- **Email Notifications**: Approval requests and summaries

---

## 🔐 **Security & Multi-Tenancy**

### **Data Isolation:**
- **Row-Level Security**: PostgreSQL RLS for tenant separation
- **API Authorization**: JWT tokens with role validation
- **Resource Access**: Tenant-scoped queries and mutations

### **Authentication:**
- **NextAuth.js**: Secure authentication flow
- **OAuth Integration**: LinkedIn social login
- **Role-Based Access**: 4-tier permission system
- **Session Management**: Secure token handling

---

## 📈 **Business Model**

### **Pricing Tiers:**
- **Starter**: €29/month - 50 posts, 1 user, basic AI
- **Pro**: €99/month - 200 posts, 5 users, advanced features
- **Enterprise**: €299/month - Unlimited usage, custom AI

### **Revenue Projections:**
- **Month 6**: 200 customers → €178K/year ARR
- **Month 12**: 500 customers → €474K/year ARR

### **Key Metrics:**
- **Customer Acquisition**: Social media, content marketing
- **Retention**: AI learning creates switching costs
- **Expansion**: Team growth and feature upgrades

---

## 📚 **API Documentation**

### **Core Endpoints:**
- `GET /api/health` - Health check
- `POST /api/auth/signin` - User authentication
- `GET /api/dashboard/stats` - Dashboard metrics
- `POST /api/content/generate` - AI content generation
- `POST /api/posts/schedule` - Schedule posts
- `GET /api/brand/assets` - Brand asset management

### **Authentication:**
All API requests require valid JWT token in Authorization header:
```
Authorization: Bearer <jwt-token>
```

### **Multi-tenant Context:**
All requests automatically scoped to user's tenant based on JWT payload.

---

## 🧪 **Development**

### **Project Structure:**
```
src/
├── app/              # Next.js app router
│   ├── api/          # API routes
│   ├── dashboard/    # Dashboard pages
│   └── auth/         # Authentication pages
├── components/       # React components
│   ├── ui/           # Reusable UI components
│   └── dashboard/    # Dashboard-specific components
├── lib/              # Utilities and configurations
│   ├── prisma.ts     # Database client
│   ├── utils.ts      # Helper functions
│   └── ai/           # AI integration
└── types/            # TypeScript type definitions
```

### **Available Scripts:**
```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint checking
npm run type-check   # TypeScript validation
npm run db:push      # Push schema changes
npm run db:migrate   # Create migrations
npm run db:seed      # Seed database
npm run db:studio    # Prisma Studio GUI
```

### **Code Quality:**
- **TypeScript**: Full type safety
- **ESLint**: Code linting and formatting
- **Prettier**: Code style consistency
- **Husky**: Pre-commit hooks

---

## 🤝 **Contributing**

### **Development Workflow:**
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### **Code Standards:**
- Follow TypeScript best practices
- Use conventional commit messages
- Add tests for new features
- Update documentation

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 **Support**

### **Documentation:**
- [Quick Start Guide](QUICK_START.md)
- [Railway Deployment](RAILWAY_DEPLOY.md)
- [API Reference](API_DOCS.md)
- [Project Status](PROJECT_STATUS.md)

### **Contact:**
- **Company**: AI MINDLOOP SRL
- **Website**: [mindloop.ro](https://mindloop.ro)
- **Support**: support@mindloop.ro

---

## 🌟 **Acknowledgments**

- Built with ❤️ by **AI MINDLOOP SRL**
- Powered by cutting-edge AI technologies
- Designed for Romanian market and global expansion
- Special thanks to the open-source community

---

**Ready to revolutionize social media automation! 🚀✨**