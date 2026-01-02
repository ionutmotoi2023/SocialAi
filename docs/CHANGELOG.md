# 📋 Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Subscription & billing management
- Usage limits & quota enforcement
- Tenant CRUD forms (create/edit)
- Tenant impersonation feature
- Platform analytics dashboard
- Feature flags system
- Audit logging
- Stripe integration

---

## [0.3.0] - 2026-01-02

### Added
- **Super Admin Dashboard** (`/dashboard/super-admin`)
  - View all tenants with statistics
  - Search tenants by name, domain, industry
  - View tenant details (users, posts, sources, assets)
  - Delete tenant functionality
  - Platform-wide statistics (total tenants, users, posts, active auto-pilots)
- **Super Admin API Endpoints**
  - `GET /api/super-admin/tenants` - List all tenants
  - `POST /api/super-admin/tenants` - Create new tenant
  - `GET /api/super-admin/tenants/[id]` - Get tenant details
  - `PUT /api/super-admin/tenants/[id]` - Update tenant
  - `DELETE /api/super-admin/tenants/[id]` - Delete tenant
- **Dashboard Statistics API**
  - `GET /api/dashboard/stats` - Dashboard metrics (posts, AI confidence, time saved)
- **Helper Scripts**
  - `scripts/verify-users.js` - Verify users in production database
  - `scripts/setup-database.sh` - Database setup for Railway
- **Documentation System**
  - `docs/ARCHITECTURE.md` - System architecture documentation
  - `docs/DECISIONS.md` - Technical decisions log
  - `docs/DEVELOPMENT_LOG.md` - Daily development log
  - `docs/CHANGELOG.md` - This file
  - Documentation folder structure (api/, guides/, conversations/)

### Fixed
- **Authentication Issues**
  - Created missing SUPER_ADMIN user (`superadmin@mindloop.ro`) in production
  - Fixed 401 Unauthorized errors on login
- **Dashboard Errors**
  - Fixed 500 error on `/api/dashboard/stats` (endpoint was missing)
  - Fixed "Application error" caused by dashboard APIs not supporting SUPER_ADMIN
  - Fixed TypeError when accessing `tenant.name` for SUPER_ADMIN (null tenant)
- **SUPER_ADMIN Support**
  - `/api/dashboard/stats` now handles SUPER_ADMIN (platform-wide stats)
  - `/api/dashboard/activity` now handles SUPER_ADMIN (all posts)
  - `/api/dashboard/ai-insights` now handles SUPER_ADMIN (all insights)
  - Sidebar component handles null tenant for SUPER_ADMIN
  - Settings page handles null tenant for SUPER_ADMIN

### Changed
- **Multi-tenant Query Pattern**
  - Implemented dynamic whereClause for SUPER_ADMIN vs tenant users
  - All dashboard APIs now check `role === 'SUPER_ADMIN'` before filtering by tenantId
- **Prisma Client**
  - Regenerated to match updated schema (tenantId optional for users)

### Technical
- **Commits**: `b8a825f`, `2a2362d`, `912265b`, `11363d9`
- **Files Added**: 8
- **Files Modified**: 5
- **Lines Changed**: +500, -20

---

## [0.2.0] - 2025-12-XX (Previous Version)

### Added
- AI-powered post generation with GPT-4, Claude, Gemini
- Auto-Pilot mode for automated posting
- LinkedIn integration
- Brand training and learning
- Content sources (RSS, websites)
- Multi-tenant architecture
- User roles: TENANT_ADMIN, EDITOR, VIEWER

### Fixed
- Build errors (missing postcss.config.js)
- Tailwind CSS compilation
- Environment variable configuration

---

## [0.1.0] - 2025-11-XX (Initial Version)

### Added
- Initial Next.js 14 setup with App Router
- Prisma ORM with PostgreSQL
- NextAuth.js authentication
- Basic UI with Tailwind CSS
- Railway deployment configuration

---

## Version Format

**[MAJOR.MINOR.PATCH]**

- **MAJOR**: Breaking changes (e.g., database schema changes requiring migration)
- **MINOR**: New features (e.g., Super Admin Dashboard)
- **PATCH**: Bug fixes (e.g., fixing 401 errors)

---

## Categories

- **Added**: New features
- **Changed**: Changes to existing features
- **Deprecated**: Features that will be removed
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

---

**Maintained By**: Development Team  
**Last Updated**: 2026-01-02
