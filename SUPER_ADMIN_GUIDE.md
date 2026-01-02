# 🛡️ Super Admin Guide - SocialAI Platform

## 📋 Table of Contents
1. [Overview](#overview)
2. [Super Admin Credentials](#super-admin-credentials)
3. [Access & Authentication](#access--authentication)
4. [Super Admin Dashboard](#super-admin-dashboard)
5. [Managing Tenants](#managing-tenants)
6. [User Roles & Permissions](#user-roles--permissions)
7. [API Endpoints](#api-endpoints)
8. [Database Management](#database-management)

---

## 🎯 Overview

**Super Admin** este cel mai înalt nivel de acces în aplicația SocialAI. Un Super Admin poate:

- ✅ **Vizualiza TOȚI tenants** (companiile) din platformă
- ✅ **Crea tenants noi**
- ✅ **Edita tenants existenți**
- ✅ **Șterge tenants** (inclusiv toate datele asociate)
- ✅ **Accesa orice tenant** prin "impersonate"
- ✅ **Vizualiza statistici globale** pentru toată platforma
- ✅ **Nu este legat de niciun tenant specific** (`tenantId: null`)

---

## 🔑 Super Admin Credentials

### Demo Super Admin User

După rularea `npm run seed`, se creează automat un Super Admin:

```
📧 Email: superadmin@mindloop.ro
🔑 Password: (orice parolă funcționează în demo mode)
🛡️ Role: SUPER_ADMIN
🏢 Tenant: null (accesează TOȚI tenants)
```

### Creare Super Admin Manual

#### Metoda 1: Direct în baza de date (Prisma Studio)

```bash
npx prisma studio
```

Apoi:
1. Deschide tabelul `User`
2. Creează un nou user:
   - `email`: email-ul admin
   - `name`: numele complet
   - `role`: selectează `SUPER_ADMIN`
   - `tenantId`: **lăsați NULL** (foarte important!)

#### Metoda 2: Prin SQL direct

```sql
INSERT INTO "users" (
  "id",
  "email", 
  "name", 
  "role", 
  "tenantId",
  "createdAt",
  "updatedAt"
) VALUES (
  'super-admin-user-id',
  'your-email@domain.com',
  'Your Full Name',
  'SUPER_ADMIN',
  NULL,
  NOW(),
  NOW()
);
```

#### Metoda 3: Prin script seed customizat

Editează `prisma/seed.ts`:

```typescript
const superAdmin = await prisma.user.upsert({
  where: { email: 'your-email@domain.com' },
  update: {},
  create: {
    email: 'your-email@domain.com',
    name: 'Your Name',
    role: 'SUPER_ADMIN',
    tenantId: null, // IMPORTANT: NULL pentru Super Admin
  },
})
```

Apoi rulează:
```bash
npm run seed
```

---

## 🔐 Access & Authentication

### 1. Login ca Super Admin

```
URL: https://your-app-url.com/login
Email: superadmin@mindloop.ro
Password: (orice în demo mode, sau password-ul real în producție)
```

### 2. Acces la Super Admin Dashboard

După login, Super Admin va vedea un item **"Super Admin"** în sidebar cu badge-ul **ADMIN**.

**Desktop:** 
- Click pe **Super Admin** în sidebar (stânga)

**Mobile:**
- Click pe **Menu** (bottom bar)
- Scroll până la **Super Admin** în lista de navigare

**Direct URL:**
```
/dashboard/super-admin
```

### 3. Verificare Rol

Dacă un user care **NU** este SUPER_ADMIN încearcă să acceseze `/dashboard/super-admin`, va vedea:

```
🛡️ Access Denied
Super Admin access required
```

---

## 📊 Super Admin Dashboard

### Overview

Dashboard-ul Super Admin oferă o vedere completă asupra întregii platforme:

#### 📈 Statistici Globale (Top Cards)

1. **Total Tenants** 🏢
   - Numărul total de companii (tenants) din platformă
   - Icon: `Building2` (albastru)

2. **Total Users** 👥
   - Suma tuturor utilizatorilor din TOȚI tenants
   - Icon: `Users` (verde)

3. **Total Posts** 📄
   - Suma tuturor posturilor create în platformă
   - Icon: `FileText` (mov)

4. **Active Auto-Pilots** 📈
   - Numărul de tenants cu Auto-Pilot activat
   - Icon: `TrendingUp` (portocaliu)

#### 🔍 Tenant List View

Fiecare tenant card afișează:

- **Logo & Nume** (cu domain dacă există)
- **Statistici**:
  - 👥 Users
  - 📄 Posts
  - 🔗 Content Sources
  - 🖼️ Brand Assets
- **Industry badge** (dacă este setat)
- **Auto-Pilot status** (badge verde dacă este activ)
- **Company Name** din Brand Variables (în AI Config)

#### 🎛️ Acțiuni Disponibile

Pentru fiecare tenant:

1. **👁️ View Details** (Eye icon)
   - Deschide un modal cu detalii complete despre tenant

2. **✏️ Edit** (Edit icon)
   - Navighează la `/dashboard/super-admin/tenants/{tenantId}`
   - Editează toate setările tenantului

3. **🗑️ Delete** (Trash icon, roșu)
   - Șterge PERMANENT tenantul
   - ⚠️ **ATENȚIE**: Șterge TOATE datele (users, posts, configs, brand assets, etc.)
   - Cere confirmare dublă

4. **🚀 Access Tenant** (Button principal, albastru)
   - "Impersonate" - permite Super Admin să acceseze dashboard-ul tenantului
   - Navighează la `/dashboard/super-admin/impersonate/{tenantId}`

#### 🔎 Search & Filter

- **Search box** cu placeholder: "Search by name, domain, or industry..."
- Filtrează live după:
  - Numele companiei
  - Domain
  - Industry

#### ➕ New Tenant Button

- Creează un tenant nou din interfață
- API endpoint: `POST /api/super-admin/tenants`

---

## 🏢 Managing Tenants

### View All Tenants

```typescript
// API Call
GET /api/super-admin/tenants

// Response
{
  "success": true,
  "tenants": [
    {
      "id": "tenant-uuid",
      "name": "Company Name",
      "domain": "company.com",
      "website": "https://company.com",
      "industry": "Technology",
      "description": "Company description",
      "logo": "https://cloudinary.com/logo.png",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T15:45:00Z",
      "stats": {
        "users": 5,
        "posts": 120,
        "contentSources": 3,
        "brandAssets": 8
      },
      "admins": [
        {
          "id": "user-uuid",
          "name": "Admin Name",
          "email": "admin@company.com"
        }
      ],
      "aiConfig": {
        "selectedModel": "gpt-4-turbo",
        "brandVoice": "Professional and innovative",
        "companyName": "TechFlow Solutions"
      },
      "autoPilotConfig": {
        "enabled": true,
        "postsPerWeek": 5
      }
    }
  ]
}
```

### Create New Tenant

```typescript
// API Call
POST /api/super-admin/tenants

// Request Body
{
  "name": "New Company Inc",
  "domain": "newcompany.com",
  "website": "https://newcompany.com",
  "industry": "Healthcare",
  "description": "A revolutionary healthcare platform"
}

// Response
{
  "success": true,
  "tenant": {
    "id": "new-tenant-uuid",
    "name": "New Company Inc",
    // ... toate câmpurile
  },
  "message": "Tenant created successfully"
}
```

**Ce se întâmplă automat:**
1. Se creează tenant-ul în DB
2. Se creează `AIConfig` default pentru tenant
3. Se creează `AutoPilotConfig` default pentru tenant

**Notă**: Nu se creează automat USERS! Trebuie creat manual primul admin.

### Update Tenant

```typescript
// API Call
PUT /api/super-admin/tenants/{tenantId}

// Request Body (toate câmpurile opționale)
{
  "name": "Updated Company Name",
  "domain": "updated-domain.com",
  "website": "https://updated-website.com",
  "industry": "Updated Industry",
  "description": "Updated description",
  "logo": "https://cloudinary.com/new-logo.png"
}

// Response
{
  "success": true,
  "tenant": { /* updated tenant */ },
  "message": "Tenant updated successfully"
}
```

### Delete Tenant (⚠️ DANGEROUS)

```typescript
// API Call
DELETE /api/super-admin/tenants/{tenantId}

// Response
{
  "success": true,
  "message": "Tenant deleted successfully"
}
```

**Ce se șterge (CASCADE DELETE):**
- ✅ Toate **Users** din tenant
- ✅ Toate **Posts** create de tenant
- ✅ Toate **Brand Assets** ale tenantului
- ✅ Toate **Content Sources** (RSS feeds, etc.)
- ✅ **AI Config** al tenantului
- ✅ **Auto-Pilot Config** al tenantului
- ✅ Toate **AI Learning Data**
- ✅ Toate **Brand Training Data**
- ✅ **LinkedIn Integrations**
- ✅ **Team Invitations**

**⚠️ ATENȚIE:** Această acțiune este **IREVERSIBILĂ**!

### Get Single Tenant Details

```typescript
// API Call
GET /api/super-admin/tenants/{tenantId}

// Response - structură completă cu toate relațiile
{
  "success": true,
  "tenant": {
    "id": "tenant-uuid",
    "name": "Company Name",
    // ... toate câmpurile tenant
    "_count": {
      "users": 5,
      "posts": 120,
      "contentSources": 3,
      "brandAssets": 8,
      "aiLearningData": 450,
      "brandTrainingData": 12
    },
    "users": [
      {
        "id": "user-uuid",
        "name": "User Name",
        "email": "user@company.com",
        "role": "TENANT_ADMIN",
        "avatar": null,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "aiConfigs": [ /* AI configuration */ ],
    "autoPilotConfigs": [ /* Auto-Pilot config */ ],
    "posts": [ /* last 10 posts */ ],
    "contentSources": [ /* RSS feeds, etc. */ ],
    "brandAssets": [ /* logos, images */ ]
  }
}
```

---

## 👥 User Roles & Permissions

### Hierarchy of Roles

```
1. SUPER_ADMIN (highest) 🛡️
   ↓
2. TENANT_ADMIN 👨‍💼
   ↓
3. EDITOR ✍️
   ↓
4. VIEWER 👁️ (lowest)
```

### Role Definitions

#### 🛡️ SUPER_ADMIN
- **tenantId**: `null` (nu aparține niciunui tenant)
- **Acces**: TOȚI tenants din platformă
- **Permisiuni**:
  - ✅ View/Create/Update/Delete orice tenant
  - ✅ Impersonate orice tenant
  - ✅ View statistici globale
  - ✅ Access la `/dashboard/super-admin`
  - ✅ Toate permisiunile TENANT_ADMIN pentru TOȚI tenants
- **Locații**:
  - Sidebar: item "Super Admin" (visible doar pentru SUPER_ADMIN)
  - URL: `/dashboard/super-admin`
  - API: `/api/super-admin/*`

#### 👨‍💼 TENANT_ADMIN
- **tenantId**: `{specific-tenant-id}`
- **Acces**: Doar propriul tenant
- **Permisiuni**:
  - ✅ Configurare AI (Brand Variables, AI Settings)
  - ✅ Brand Training & Assets
  - ✅ Content Sources (RSS feeds)
  - ✅ Auto-Pilot setup
  - ✅ Team management (invite, promote, remove users)
  - ✅ Integrări (LinkedIn, etc.)
  - ✅ Create/Edit/Delete posts
  - ✅ View analytics
- **Restricții**:
  - ❌ NU poate accesa alți tenants
  - ❌ NU poate vedea Super Admin dashboard
  - ❌ NU poate crea/șterge tenants

#### ✍️ EDITOR
- **tenantId**: `{specific-tenant-id}`
- **Acces**: Doar propriul tenant (read-write)
- **Permisiuni**:
  - ✅ Create/Edit posts
  - ✅ Use AI generation
  - ✅ Schedule posts
  - ✅ View analytics (partial)
- **Restricții**:
  - ❌ NU poate modifica AI Config
  - ❌ NU poate invita utilizatori
  - ❌ NU poate șterge tenantul

#### 👁️ VIEWER
- **tenantId**: `{specific-tenant-id}`
- **Acces**: Doar propriul tenant (read-only)
- **Permisiuni**:
  - ✅ View posts
  - ✅ View analytics
  - ✅ View calendar
- **Restricții**:
  - ❌ NU poate crea/edita posts
  - ❌ NU poate modifica setări

### Permission Checks în Cod

Exemple de verificări în API routes:

```typescript
// Check SUPER_ADMIN only
if (session.user.role !== 'SUPER_ADMIN') {
  return NextResponse.json({ 
    error: 'Forbidden - Super Admin access required' 
  }, { status: 403 })
}

// Check TENANT_ADMIN or SUPER_ADMIN
if (session.user.role !== 'TENANT_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
  return NextResponse.json({ 
    error: 'Forbidden - Admin access required' 
  }, { status: 403 })
}

// Check user belongs to tenant (for TENANT_ADMIN)
if (session.user.role !== 'SUPER_ADMIN' && session.user.tenantId !== targetTenantId) {
  return NextResponse.json({ 
    error: 'Forbidden - Access denied to this tenant' 
  }, { status: 403 })
}
```

---

## 🔌 API Endpoints

### Super Admin Endpoints

Toate endpoint-urile SUPER_ADMIN necesită:
- ✅ Sesiune autentificată (NextAuth)
- ✅ `session.user.role === 'SUPER_ADMIN'`

#### Tenants Management

```typescript
// List all tenants
GET /api/super-admin/tenants
Authorization: Session-based (NextAuth)
Response: { success: true, tenants: [...] }

// Create tenant
POST /api/super-admin/tenants
Body: { name, domain?, website?, industry?, description? }
Response: { success: true, tenant: {...}, message }

// Get tenant details
GET /api/super-admin/tenants/{id}
Response: { success: true, tenant: {...} }

// Update tenant
PUT /api/super-admin/tenants/{id}
Body: { name?, domain?, website?, industry?, description?, logo? }
Response: { success: true, tenant: {...}, message }

// Delete tenant (DANGEROUS!)
DELETE /api/super-admin/tenants/{id}
Response: { success: true, message }
```

#### Impersonate (Future Feature)

```typescript
// Access tenant as Super Admin
GET /dashboard/super-admin/impersonate/{tenantId}

// Conceptual API (not yet implemented)
POST /api/super-admin/impersonate
Body: { tenantId: "target-tenant-id" }
Response: { success: true, token: "impersonation-token", tenant: {...} }

// Exit impersonation
POST /api/super-admin/exit-impersonate
Response: { success: true, message: "Returned to Super Admin view" }
```

### Protected Tenant Endpoints

Endpoint-uri care verifică acces tenant (TENANT_ADMIN sau SUPER_ADMIN):

```typescript
// Brand Training
POST /api/brand/scrape
DELETE /api/brand/scrape
// Requires: TENANT_ADMIN or SUPER_ADMIN

// Brand Assets
POST /api/brand/assets
PUT /api/brand/assets/{id}
DELETE /api/brand/assets/{id}
// Requires: TENANT_ADMIN or SUPER_ADMIN

// Auto-Pilot Config
PUT /api/autopilot/config
// Requires: TENANT_ADMIN or SUPER_ADMIN

// Team Management
POST /api/team/invite
DELETE /api/team/members/{id}
// Requires: TENANT_ADMIN or SUPER_ADMIN

// Company Profile
PATCH /api/settings/company-profile
// Requires: TENANT_ADMIN or SUPER_ADMIN
```

---

## 💾 Database Management

### Prisma Schema - User Model

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  avatar    String?
  role      UserRole @default(VIEWER)
  
  // Tenant relation - NULL pentru SUPER_ADMIN
  tenantId  String?
  tenant    Tenant?  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Relations
  posts            Post[]
  invitations      Invitation[]
  aiLearningData   AILearningData[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

enum UserRole {
  SUPER_ADMIN    // 🛡️ Full platform access
  TENANT_ADMIN   // 👨‍💼 Tenant management
  EDITOR         // ✍️ Content creation
  VIEWER         // 👁️ Read-only
}
```

### Key Database Facts

1. **SUPER_ADMIN** are `tenantId = NULL`
   - Nu aparține niciunui tenant
   - Poate accesa TOȚI tenants prin queries

2. **Cascade Delete** pe tenant
   - Când ștergi un tenant, se șterg automat:
     - Toate `Users` cu `tenantId = tenant.id`
     - Toate `Posts` cu `tenantId = tenant.id`
     - Etc. (vezi schema Prisma)

3. **Unique Constraints**
   - `user.email` - UNIQUE global (nu doar per tenant)
   - `tenant.domain` - UNIQUE (opțional)
   - `aiConfig.tenantId` - UNIQUE (un singur AI config per tenant)

### Common Queries

#### Find all Super Admins
```typescript
const superAdmins = await prisma.user.findMany({
  where: {
    role: 'SUPER_ADMIN',
    tenantId: null,
  },
})
```

#### Find all tenants with stats
```typescript
const tenants = await prisma.tenant.findMany({
  include: {
    _count: {
      select: {
        users: true,
        posts: true,
        contentSources: true,
        brandAssets: true,
      },
    },
  },
})
```

#### Create Super Admin user
```typescript
const superAdmin = await prisma.user.create({
  data: {
    email: 'admin@example.com',
    name: 'Super Admin',
    role: 'SUPER_ADMIN',
    tenantId: null, // IMPORTANT!
  },
})
```

#### Promote user to Super Admin
```typescript
await prisma.user.update({
  where: { email: 'user@example.com' },
  data: {
    role: 'SUPER_ADMIN',
    tenantId: null, // Remove tenant association
  },
})
```

#### Delete tenant and all data
```typescript
// Cascade delete handled by Prisma
await prisma.tenant.delete({
  where: { id: 'tenant-uuid' },
})
// Automatically deletes: users, posts, configs, assets, etc.
```

---

## 🚀 Setup Instructions

### Development Environment

```bash
# 1. Clone repository
git clone https://github.com/ionutmotoi2023/SocialAi.git
cd SocialAi

# 2. Install dependencies
npm ci

# 3. Setup environment variables
cp .env.example .env
# Edit .env and add DATABASE_URL

# 4. Generate Prisma Client
npx prisma generate

# 5. Push schema to database
npx prisma db push

# 6. Seed database (creates Super Admin)
npm run seed

# 7. Start development server
npm run dev

# 8. Login as Super Admin
# Email: superadmin@mindloop.ro
# Password: (any password in demo mode)
```

### Production Setup

```bash
# 1. Deploy to production (Railway, Vercel, etc.)

# 2. Run migrations
npx prisma migrate deploy

# 3. Create Super Admin manually
# Option A: Prisma Studio
npx prisma studio

# Option B: SQL direct
psql $DATABASE_URL
INSERT INTO "users" (id, email, name, role, "tenantId", "createdAt", "updatedAt")
VALUES ('super-admin-id', 'admin@yourdomain.com', 'Your Name', 'SUPER_ADMIN', NULL, NOW(), NOW());

# 4. Login with Super Admin credentials
```

---

## 📝 Best Practices

### Security

1. **Protect Super Admin credentials**
   - Nu împărtăși email/parola de Super Admin
   - Folosește 2FA dacă este implementat
   - Schimbă parola regulat

2. **Audit logging**
   - Toate acțiunile SUPER_ADMIN ar trebui logguite
   - Monitorizează ștergeri de tenants
   - Track impersonations

3. **Backup înainte de delete**
   - Fă backup la DB înainte de a șterge tenants importanți
   - Salvează export JSON al tenant data

### Operational

1. **Crearea tenants noi**
   - Completează toate câmpurile importante (name, website, industry)
   - Creează TENANT_ADMIN user manual după crearea tenantului
   - Configurează AI settings și brand variables

2. **Monitoring**
   - Verifică regular numărul de tenants activi
   - Monitorizează Auto-Pilot usage
   - Track total posts și users

3. **Maintenance**
   - Șterge tenants inactive după 90+ zile (cu confirmare)
   - Arhivează date importante înainte de delete
   - Curăță brand assets nefolosite

---

## 🐛 Troubleshooting

### Nu văd "Super Admin" în sidebar

**Cauze posibile:**
1. User-ul nu are `role: 'SUPER_ADMIN'`
2. User-ul are `tenantId` setat (trebuie să fie `NULL`)
3. Sesiunea nu s-a refresh-uit după upgrade la SUPER_ADMIN

**Soluție:**
```sql
-- Check user role
SELECT id, email, role, "tenantId" FROM users WHERE email = 'your-email@domain.com';

-- Fix role if needed
UPDATE users SET role = 'SUPER_ADMIN', "tenantId" = NULL WHERE email = 'your-email@domain.com';

-- Logout & login again
```

### Error: "Access Denied"

**Verificare:**
```typescript
// În browser console:
console.log(session?.user?.role)
// Trebuie să fie: "SUPER_ADMIN"

console.log(session?.user?.tenantId)
// Trebuie să fie: null
```

### Can't create tenant

**Verificări:**
1. Este session-ul valid?
2. Este user-ul SUPER_ADMIN?
3. Este `name` field completat? (required)

**Debug:**
```typescript
// Check API call în Network tab (DevTools)
POST /api/super-admin/tenants
Response: { error: "..." }
```

### Tenant delete fails

**Cauze posibile:**
1. Constraint violation (relații care blochează delete-ul)
2. Database permissions

**Soluție:**
```sql
-- Check cascade rules în Prisma schema
-- Asigură-te că toate relațiile au onDelete: Cascade
```

---

## 📚 Additional Resources

### Files Reference

- **Super Admin Dashboard**: `src/app/dashboard/super-admin/page.tsx`
- **API Routes**: `src/app/api/super-admin/tenants/`
- **Sidebar**: `src/components/dashboard/sidebar.tsx` (lines 94-99)
- **Prisma Schema**: `prisma/schema.prisma` (UserRole enum)
- **Seed Script**: `prisma/seed.ts` (lines 8-20)
- **Auth Check**: Multiple files with `session.user.role !== 'SUPER_ADMIN'`

### Related Documentation

- [Brand Variables Guide](./BRAND_VARIABLES_GUIDE.md)
- [Auto-Pilot Setup](./AUTOPILOT_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [API Documentation](./API_DOCS.md)

---

## ✅ Summary

**Super Admin** este rolul de administrare la nivel de platformă care permite:
- ✅ **Gestionarea completă** a tuturor tenants
- ✅ **Acces global** la date și statistici
- ✅ **Control total** asupra platformei

**Acces:**
- URL: `/dashboard/super-admin`
- Credentials: `superadmin@mindloop.ro` (după seed)
- Sidebar: Item "Super Admin" cu badge "ADMIN"

**Securitate:**
- Protejat cu `session.user.role === 'SUPER_ADMIN'`
- User trebuie să aibă `tenantId = NULL`
- Access denied pentru orice alt rol

---

**📅 Ultimă actualizare:** 2 Ianuarie 2026  
**🔖 Versiune:** 1.0.0  
**👨‍💻 Autor:** AI MINDLOOP SRL Development Team
