# 🎯 Technical Decisions Log

This document tracks key technical decisions made during development, including rationale, alternatives considered, and trade-offs.

---

## Decision Log

### [2026-01-02] Multi-Tenant Architecture with Row-Level Security

**Problem**: Need to isolate data between different tenants (companies) using the platform.

**Decision**: Use row-level security with `tenantId` foreign key on all tenant-specific models.

**Alternatives Considered**:
1. **Separate databases per tenant**
   - ❌ Too expensive and complex to manage
   - ❌ Difficult to do cross-tenant analytics
   
2. **Schema-based isolation** (separate schemas in same DB)
   - ❌ PostgreSQL schema management complexity
   - ❌ Connection pooling issues
   
3. **Row-level security with tenantId** ✅
   - ✅ Simple to implement
   - ✅ Easy to query
   - ✅ Cost-effective
   - ✅ Easy to backup/restore

**Implementation**:
```typescript
// Every tenant-specific model includes:
tenantId String
tenant   Tenant @relation(fields: [tenantId], references: [id])
```

**Trade-offs**:
- ✅ Pro: Simple, performant, cost-effective
- ❌ Con: Need to ensure tenantId filtering in EVERY query
- ❌ Con: Risk of data leakage if filter is missed

**Mitigation**: Use consistent query pattern with `whereClause` helper.

---

### [2026-01-02] SUPER_ADMIN with null tenantId

**Problem**: SUPER_ADMIN needs to access ALL tenants, not just one.

**Decision**: Set `tenantId = null` for SUPER_ADMIN users.

**Alternatives Considered**:
1. **Junction table** (SuperAdminAccess linking users to tenants)
   - ❌ Overly complex for initial version
   - ❌ More queries needed
   
2. **Special "all" tenantId value**
   - ❌ Pollutes tenant table with fake entry
   - ❌ Confusing in queries
   
3. **null tenantId with dynamic filtering** ✅
   - ✅ Clean separation
   - ✅ Simple to implement
   - ✅ Follows common pattern

**Implementation**:
```typescript
const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
const tenantId = isSuperAdmin ? undefined : session.user.tenantId
const whereClause = tenantId ? { tenantId } : {}

const data = await prisma.post.findMany({ where: whereClause })
```

**Trade-offs**:
- ✅ Pro: Clean, simple, performant
- ❌ Con: Must check role in every API endpoint
- ❌ Con: Easy to forget SUPER_ADMIN case

**Mitigation**: Code review checklist, automated tests.

---

### [2026-01-02] Demo Mode Authentication (Accept Any Password)

**Problem**: Need to test application quickly without implementing full password hashing.

**Decision**: Accept any password in `src/lib/auth.ts` (demo mode).

**Code**:
```typescript
// src/lib/auth.ts:73
// For demo purposes, we'll accept any password
// In production, you should check against a hashed password
const isValidPassword = true // ⚠️ INSECURE - for demo only
```

**Alternatives Considered**:
1. **Implement bcrypt immediately**
   - ❌ Slows down MVP development
   - ❌ Requires password reset flow
   
2. **Demo mode with any password** ✅
   - ✅ Fast testing
   - ✅ Clear code comments warning
   - ⚠️ Must be fixed before production

**Trade-offs**:
- ✅ Pro: Fast development, easy testing
- ❌ Con: INSECURE - cannot go to production
- ❌ Con: Must remember to fix

**Production TODO**:
- [ ] Implement bcrypt password hashing
- [ ] Add password reset flow
- [ ] Add password strength requirements

---

### [2026-01-02] Next.js App Router over Pages Router

**Problem**: Choose between Next.js App Router (new) vs Pages Router (old).

**Decision**: Use App Router (Next.js 13+).

**Reasons**:
- ✅ Modern, recommended by Next.js
- ✅ Better performance (Server Components)
- ✅ Simpler data fetching
- ✅ Better TypeScript support
- ✅ Future-proof

**Trade-offs**:
- ✅ Pro: Better DX, performance, future support
- ❌ Con: Some libraries not yet compatible
- ❌ Con: Less Stack Overflow answers
- ❌ Con: Learning curve for team

**Migration Path**: N/A (new project, started with App Router)

---

### [2026-01-02] Prisma over TypeORM

**Problem**: Choose ORM for PostgreSQL.

**Decision**: Use Prisma.

**Alternatives Considered**:
1. **TypeORM**
   - ❌ More complex API
   - ❌ Decorators can be verbose
   
2. **Drizzle ORM**
   - ❌ Too new, less mature
   
3. **Prisma** ✅
   - ✅ Excellent TypeScript support
   - ✅ Great DX (Prisma Studio, migrations)
   - ✅ Type-safe queries
   - ✅ Good documentation

**Trade-offs**:
- ✅ Pro: Best TypeScript integration, great DX
- ❌ Con: Less flexible than raw SQL
- ❌ Con: Adds build step (prisma generate)

---

### [2026-01-02] NextAuth.js for Authentication

**Problem**: Implement authentication system.

**Decision**: Use NextAuth.js (Auth.js).

**Alternatives Considered**:
1. **Custom JWT implementation**
   - ❌ Reinventing the wheel
   - ❌ Security risks
   
2. **Clerk/Auth0** (SaaS auth)
   - ❌ Vendor lock-in
   - ❌ Monthly costs
   
3. **NextAuth.js** ✅
   - ✅ Open source, free
   - ✅ Great Next.js integration
   - ✅ Supports multiple providers
   - ✅ Session management built-in

**Trade-offs**:
- ✅ Pro: Free, flexible, well-maintained
- ❌ Con: More setup than SaaS solutions
- ❌ Con: Need to manage sessions ourselves

---

## Decision Template

For future decisions, use this template:

```markdown
### [YYYY-MM-DD] Decision Title

**Problem**: What problem are we solving?

**Decision**: What did we decide to do?

**Alternatives Considered**:
1. Option 1
   - Pros
   - Cons
2. Option 2 (chosen) ✅
   - Pros
   - Cons

**Implementation**: How is it implemented?

**Trade-offs**:
- ✅ Pro: ...
- ❌ Con: ...

**Mitigation**: How do we handle the cons?

**Related**: Links to docs, PRs, issues
```

---

**Maintained By**: Development Team  
**Last Updated**: 2026-01-02
