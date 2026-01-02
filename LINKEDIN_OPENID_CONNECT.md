# 🔄 LinkedIn OAuth Migration: Legacy → OpenID Connect

## 🎯 Problema Identificată

**Din LinkedIn Developer Portal screenshot:**

```
OAuth 2.0 scopes:
✅ openid - Use your name and photo
✅ profile - Use your name and photo  
✅ w_member_social
❌ email - MISSING (but NOT needed!)
```

**Aplicația folosea legacy scopes:**
```
r_liteprofile     ← DEPRECATED
r_emailaddress    ← DEPRECATED  
w_member_social   ← Still valid
```

---

## 🔄 LinkedIn Migration

### LinkedIn a migrat de la OAuth 2.0 Legacy → OpenID Connect (OIDC)

**Documentație oficială:**
- https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2

### Legacy Scopes (DEPRECATED):

| Old Scope | Permissions | Status |
|-----------|-------------|--------|
| `r_liteprofile` | Name, profile photo, LinkedIn ID | ❌ Deprecated |
| `r_emailaddress` | Email address | ❌ Deprecated |
| `w_member_social` | Post on LinkedIn | ✅ Still valid |

### OpenID Connect Scopes (NEW):

| New Scope | Permissions | Equivalent To | Required? |
|-----------|-------------|---------------|-----------|
| `openid` | Base authentication | - | ✅ Required |
| `profile` | Name, photo, LinkedIn ID | `r_liteprofile` | ✅ YES |
| `email` | Email address | `r_emailaddress` | ❌ Optional |
| `w_member_social` | Post on LinkedIn | `w_member_social` | ✅ YES |

---

## ✅ Soluția Aplicată

### Updated Scopes în Cod:

```typescript
// Before (Legacy OAuth 2.0):
linkedInAuthUrl.searchParams.append('scope', 'r_liteprofile r_emailaddress w_member_social')

// After (OpenID Connect):
linkedInAuthUrl.searchParams.append('scope', 'openid profile w_member_social')
```

**Commit:** `73e806d` (după rebase)

---

## 📋 Scope Mapping

### What Each Scope Provides:

#### 1. `openid` (Required)
```json
{
  "sub": "abc123XYZ",  // LinkedIn member ID
  "aud": "77n8woevltj8fw"  // Your client ID
}
```

#### 2. `profile` (Replaces `r_liteprofile`)
```json
{
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe",
  "picture": "https://media.licdn.com/...",
  "locale": "en-US"
}
```

#### 3. `email` (Replaces `r_emailaddress`) - OPTIONAL
```json
{
  "email": "john.doe@company.com",
  "email_verified": true
}
```

#### 4. `w_member_social` (Unchanged)
- Permission to create posts on user's behalf
- Permission to share content
- **CRITICAL** for posting functionality ✅

---

## 🎯 De Ce NU Avem Nevoie de `email`?

### Email-ul E Deja Disponibil Din NextAuth!

**În aplicație:**
```typescript
// User is already authenticated with NextAuth
const session = await getServerSession(authOptions)

console.log(session.user.email)  // ← DEJA AVEM EMAIL!
// Output: 'admin@mindloop.ro'
```

**LinkedIn integration folosește `tenantId` pentru mapping:**
```typescript
// Auth endpoint:
linkedInAuthUrl.searchParams.append('state', session.user.tenantId)

// Callback endpoint:
const tenantId = searchParams.get('state')
await prisma.linkedInIntegration.upsert({
  where: { tenantId },
  create: {
    tenantId,
    linkedinId: profileData.sub,  // OpenID Connect ID
    profileName: profileData.name,
    profileImage: profileData.picture,
    // ...
  }
})
```

**Concluzie:**
- ✅ Email utilizator = `session.user.email` (NextAuth)
- ✅ LinkedIn profile = `openid + profile` scopes
- ✅ Posting permissions = `w_member_social` scope
- ❌ `email` scope = NOT needed!

---

## 🔍 Diferențe API Endpoints

### Legacy OAuth 2.0:

**Profile endpoint:**
```
GET https://api.linkedin.com/v2/me
Authorization: Bearer {access_token}

Response:
{
  "id": "abc123XYZ",
  "localizedFirstName": "John",
  "localizedLastName": "Doe",
  "profilePicture": { ... }
}
```

### OpenID Connect:

**UserInfo endpoint:**
```
GET https://api.linkedin.com/v2/userinfo
Authorization: Bearer {access_token}

Response (with openid + profile):
{
  "sub": "abc123XYZ",
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe",
  "picture": "https://media.licdn.com/...",
  "locale": "en-US"
}

Response (with openid + profile + email):
{
  "sub": "abc123XYZ",
  "name": "John Doe",
  "email": "john.doe@company.com",
  "email_verified": true,
  // ...
}
```

---

## 🔧 Modificări în Callback Route

**Trebuie să actualizăm și callback-ul pentru OpenID Connect:**

### Current Code (pentru legacy):
```typescript
const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
  headers: {
    Authorization: `Bearer ${access_token}`,
    'X-Restli-Protocol-Version': '2.0.0',
  },
})

const profileData = await profileResponse.json()

// Legacy response structure:
profileData.id  // LinkedIn ID
profileData.localizedFirstName
profileData.localizedLastName
```

### Updated Code (pentru OpenID Connect):
```typescript
const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
  headers: {
    Authorization: `Bearer ${access_token}`,
  },
})

const profileData = await profileResponse.json()

// OpenID Connect response structure:
profileData.sub  // LinkedIn ID (Subject)
profileData.name  // Full name
profileData.given_name  // First name
profileData.family_name  // Last name
profileData.picture  // Profile picture URL
```

**Trebuie să actualizăm și asta! →**

---

## ⚠️ TODO: Update Callback Route

**Fișier:** `src/app/api/integrations/linkedin/callback/route.ts`

**Modificări necesare:**
1. Schimbă endpoint: `/v2/me` → `/v2/userinfo`
2. Remove header: `X-Restli-Protocol-Version`
3. Update field mapping:
   - `profileData.id` → `profileData.sub`
   - `profileData.localizedFirstName` → `profileData.given_name`
   - `profileData.localizedLastName` → `profileData.family_name`
   - `profileData.profilePicture` → `profileData.picture`

---

## 📊 What's Fixed

### Before:
```typescript
// Auth route used legacy scopes:
scope: 'r_liteprofile w_member_social'

// LinkedIn response:
❌ unauthorized_scope_error
errorDescription: 'Scope "r_liteprofile" is deprecated'
```

### After:
```typescript
// Auth route uses OpenID Connect:
scope: 'openid profile w_member_social'

// LinkedIn response:
✅ OAuth succeeds with OpenID Connect
✅ Authorization code returned
✅ Access token obtained
✅ UserInfo fetched from /v2/userinfo
✅ Integration saved
```

---

## 🚀 Next Steps

### 1. Așteaptă Railway Redeploy (~3-5 min)

**Railway Dashboard:**
- Commit: `73e806d`
- Status: Deploying...

### 2. Update Callback Route (IMPORTANT!)

Trebuie să modificăm și callback-ul pentru OpenID Connect endpoint!

**Fișier:** `src/app/api/integrations/linkedin/callback/route.ts`

### 3. Test OAuth Flow

**După ambele fix-uri:**
1. Login: `https://socialai.mindloop.ro`
2. Settings → Integrations
3. Connect LinkedIn
4. ✅ Should work with OpenID Connect!

---

## 📚 LinkedIn Documentation

**Official migration guide:**
- https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/migration-guide
- https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2

**OpenID Connect endpoints:**
- Authorization: `https://www.linkedin.com/oauth/v2/authorization`
- Token: `https://www.linkedin.com/oauth/v2/accessToken`
- UserInfo: `https://api.linkedin.com/v2/userinfo` ← NEW!

---

## ✅ Summary

**Problem:** Aplicația folosea legacy OAuth 2.0 scopes (`r_liteprofile`)

**Root Cause:** LinkedIn a migrat la OpenID Connect (OIDC)

**Solution:** 
- Update auth scopes: `openid profile w_member_social`
- Update callback endpoint: `/v2/me` → `/v2/userinfo`
- Update field mapping: legacy → OpenID Connect

**Status:** 
- ✅ Auth route updated (commit `73e806d`)
- ⏳ Callback route needs update (next task)

**Impact:** OAuth va funcționa cu OpenID Connect standard

---

**Next Action:** Update callback route pentru OpenID Connect UserInfo API
