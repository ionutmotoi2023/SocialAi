# 🏗️ Architecture Documentation

## System Overview

**Social Media AI SaaS** is a multi-tenant platform for AI-powered social media automation.

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: React 18, Tailwind CSS, shadcn/ui
- **State Management**: React Hooks, NextAuth sessions
- **Forms**: React Hook Form + Zod validation

### Backend
- **Runtime**: Node.js
- **API**: Next.js API Routes (App Router)
- **Authentication**: NextAuth.js
- **Database ORM**: Prisma

### Database
- **Type**: PostgreSQL
- **Hosting**: Railway
- **Schema**: Multi-tenant with row-level security

### AI Services
- **OpenAI GPT-4**: Text generation
- **Claude 3**: Alternative text generation
- **Gemini Pro**: Alternative text generation
- **Cloudinary**: Image management

### Deployment
- **Platform**: Railway
- **CI/CD**: Git push → auto-deploy
- **Domain**: socialai.mindloop.ro

---

## Architecture Patterns

### 1. Multi-Tenant Architecture

**Design**: Row-level security with `tenantId` foreign key

```typescript
// Every tenant-specific model has:
model Post {
  id       String @id
  tenantId String
  // ...
  tenant   Tenant @relation(fields: [tenantId], references: [id])
}
```

**Special Case: SUPER_ADMIN**
- `tenantId = null` (can access ALL tenants)
- Dynamic query filtering:
```typescript
const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
const tenantId = isSuperAdmin ? undefined : session.user.tenantId
const whereClause = tenantId ? { tenantId } : {}
```

### 2. Authentication Flow

**Provider**: Credentials (email/password)

**Current Mode**: DEMO MODE
- Any password is accepted (see `src/lib/auth.ts:73`)
- User must exist in database
- Session includes: user, role, tenantId, tenant

**Session Structure**:
```typescript
session.user = {
  id: string
  email: string
  name: string
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'EDITOR' | 'VIEWER'
  tenantId: string | null  // null for SUPER_ADMIN
  tenant: {
    id: string
    name: string
    domain: string
  } | null
}
```

### 3. API Route Patterns

**Standard Pattern**:
```typescript
export async function GET(request: NextRequest) {
  // 1. Auth check
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Role-based access
  const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
  const tenantId = isSuperAdmin ? undefined : session.user.tenantId

  // 3. Build query with tenant isolation
  const whereClause = tenantId ? { tenantId } : {}

  // 4. Fetch data
  const data = await prisma.post.findMany({ where: whereClause })

  // 5. Return response
  return NextResponse.json({ success: true, data })
}
```

### 4. Component Patterns

**Client Components**: Use `'use client'` directive
- Forms (need user interaction)
- Components with useState/useEffect
- Components using useSession

**Server Components**: Default
- Static pages
- Data fetching on server
- Better performance

---

## Database Schema Design

### Core Models

#### Tenant
- Central entity for multi-tenancy
- Relations: users, posts, aiConfigs, autoPilotConfigs, brandAssets, etc.

#### User
- Belongs to ONE tenant (except SUPER_ADMIN)
- Role-based permissions

#### Post
- Content created by users
- AI-generated or manual
- Status: DRAFT, SCHEDULED, PUBLISHED, FAILED

#### AIConfig
- One per tenant
- Stores AI preferences, brand voice, tone

#### AutoPilotConfig
- One per tenant
- Controls automated posting

---

## Security Considerations

### Current State (MVP/Demo)
- ⚠️ **No password hashing** - Demo mode accepts any password
- ⚠️ **No rate limiting** - Open to abuse
- ⚠️ **No CSRF protection** - Using NextAuth defaults

### Production TODOs
- [ ] Implement bcrypt password hashing
- [ ] Add rate limiting (e.g., express-rate-limit)
- [ ] CSRF tokens for forms
- [ ] Input sanitization
- [ ] SQL injection prevention (Prisma handles this)
- [ ] XSS prevention (React handles this)

---

## Performance Considerations

### Current Optimizations
- ✅ Parallel queries (Promise.all)
- ✅ Selective field fetching (Prisma select)
- ✅ Indexed fields (unique, foreign keys)

### Future Optimizations
- [ ] Redis caching for sessions
- [ ] Database query caching
- [ ] CDN for static assets
- [ ] Image optimization (Next.js Image)
- [ ] Code splitting (Next.js automatic)

---

## Deployment Architecture

```
GitHub Repository
    ↓ (git push)
Railway Platform
    ↓ (auto-build)
Next.js Build
    ↓ (deploy)
Production Server
    ↓ (connect)
PostgreSQL Database
```

**Environment Variables**:
- `DATABASE_URL` - PostgreSQL connection
- `NEXTAUTH_SECRET` - Session encryption
- `NEXTAUTH_URL` - App URL
- `OPENAI_API_KEY` - GPT-4 API
- (+ others for LinkedIn, Cloudinary, etc.)

---

## Key Technical Decisions

See [DECISIONS.md](./DECISIONS.md) for detailed decision log.

---

**Last Updated**: 2026-01-02  
**Maintained By**: Development Team
