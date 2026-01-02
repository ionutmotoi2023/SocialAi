# 📘 LinkedIn Multiple Profiles Integration - Complete Guide

## 🎯 Overview
This feature enables posting to **multiple LinkedIn profiles and company pages** from a single tenant account.

**User can connect:**
- ✅ Personal LinkedIn Profile
- ✅ Multiple Company Pages (where user is Administrator)

**User can choose destination per post:**
- Personal profile
- Company Page 1
- Company Page 2
- Company Page 3
- etc.

---

## 📚 Documentation Index

### **1. 🆕 [LINKEDIN_NEW_APP_SETUP.md](./LINKEDIN_NEW_APP_SETUP.md)**
**Complete guide for creating a new LinkedIn app with Community Management API**

📋 **Contents:**
- Step-by-step LinkedIn Developer Portal setup
- Community Management API request form
- Auth configuration
- Railway Variables update
- Testing after approval

⏱️ **Time:** 15 min setup + 24-48h LinkedIn review

---

### **2. 🔧 [LINKEDIN_TROUBLESHOOTING.md](./LINKEDIN_TROUBLESHOOTING.md)**
**Comprehensive troubleshooting guide when organizations don't appear**

📋 **Contents:**
- Root cause analysis (3 main causes)
- Complete solution walkthrough
- Organization role requirements
- Test organizations for development
- Debug checklist
- Common errors and solutions
- API endpoints documentation

⏱️ **Time:** 5-10 min diagnosis + solution time

---

### **3. 🔍 [LINKEDIN_SCOPES_SETUP.md](./LINKEDIN_SCOPES_SETUP.md)**
**LinkedIn OAuth scopes and permissions setup**

📋 **Contents:**
- Required scopes explanation
- Marketing Developer Platform setup
- Redirect URL configuration
- Testing flow
- Contact LinkedIn Support template

⏱️ **Time:** Reference guide

---

### **4. 📖 [LINKEDIN_MULTIPLE_PROFILES.md](./LINKEDIN_MULTIPLE_PROFILES.md)**
**Feature documentation and technical architecture**

📋 **Contents:**
- Feature overview
- Database schema changes
- API implementation details
- UI/UX flow
- Deployment guide
- Testing scenarios

⏱️ **Time:** Technical reference

---

## 🚀 Quick Start

### **For New Setup:**

1. **Read**: [LINKEDIN_NEW_APP_SETUP.md](./LINKEDIN_NEW_APP_SETUP.md)
2. **Create**: New LinkedIn app with Community Management API
3. **Wait**: 24-48h for LinkedIn approval
4. **Update**: Railway Variables with new credentials
5. **Test**: Connect LinkedIn and verify 4+ profiles appear

### **For Troubleshooting:**

1. **Read**: [LINKEDIN_TROUBLESHOOTING.md](./LINKEDIN_TROUBLESHOOTING.md)
2. **Check**: Debug checklist in order
3. **Verify**: Organization roles (ADMINISTRATOR required)
4. **Fix**: Follow solution steps
5. **Test**: Disconnect + Reconnect LinkedIn

---

## 🎯 Current Status

| Component | Status | Details |
|-----------|--------|---------|
| **Backend Code** | ✅ **READY** | Saves all organizations with role logging |
| **Frontend Code** | ✅ **READY** | Dropdown selector, badges, UI complete |
| **Database Schema** | ✅ **READY** | Multiple integrations per tenant |
| **OAuth Flow** | ✅ **READY** | Correct scopes requested |
| **Image Upload** | ✅ **READY** | 3-step LinkedIn Assets API flow |
| **Publish API** | ✅ **READY** | Organization URN support |
| **Role Validation** | ✅ **READY** | Warns if not ADMINISTRATOR |
| **Documentation** | ✅ **READY** | 4 comprehensive guides |
| **LinkedIn App** | ⏳ **PENDING** | Awaiting Community Management API approval |
| **Production Testing** | ⏳ **PENDING** | After LinkedIn approval |

---

## 🔑 Key Requirements

### **LinkedIn App Requirements:**
✅ Sign In with LinkedIn using OpenID Connect  
✅ Share on LinkedIn  
⭐ **Community Management API** ← REQUIRED for company pages!

### **User Role Requirements:**
Must have `ADMINISTRATOR` or `Super Admin` role on each company page.

**Roles that work:**
- ✅ Super Admin
- ✅ Admin
- ❌ Editor (can't read/post via API)
- ❌ Member (can't read/post via API)

### **OAuth Scopes Required:**
- `openid` - User identity
- `profile` - User profile info
- `w_member_social` - Post to personal profile
- `r_organization_admin` - Read managed organizations
- `w_organization_social` - Post to company pages

---

## 🧪 Testing

### **Test Checklist:**

#### **After LinkedIn Approval:**
- [ ] New app has Community Management API in "Added products"
- [ ] Scopes include `r_organization_admin` and `w_organization_social`
- [ ] Railway Variables updated with new Client ID/Secret
- [ ] Railway redeployed successfully

#### **User Flow:**
- [ ] Disconnect all LinkedIn connections in Settings
- [ ] Click "Connect LinkedIn"
- [ ] LinkedIn asks for "Manage organization's content" permission
- [ ] Accept permission
- [ ] Browser console shows `Organizations found: { count: 3+ }`
- [ ] Settings shows 4+ connections (1 Personal + 3+ Company)
- [ ] Each connection has correct badge (Personal/Company)

#### **Post Publishing:**
- [ ] Go to any post in dashboard
- [ ] Dropdown shows all profiles (Personal + Companies)
- [ ] Select a company page
- [ ] Click "Publish Now"
- [ ] Post appears on selected company page in LinkedIn
- [ ] Images appear correctly (if post has images)

#### **Error Handling:**
- [ ] No 403 Forbidden errors
- [ ] No console errors in browser
- [ ] No warnings about missing ADMINISTRATOR role
- [ ] Railway logs show successful publishes

---

## 📊 Architecture

### **Database Schema:**

```prisma
model LinkedInIntegration {
  id                String   @id @default(cuid())
  tenantId          String
  linkedinId        String   // User ID or Organization ID
  profileType       LinkedInProfileType
  
  // Personal Profile fields
  profileName       String?
  profileImage      String?
  
  // Company Page fields
  organizationId    String?
  organizationName  String?
  organizationUrn   String?  // urn:li:organization:{id}
  
  // Auth
  accessToken       String
  refreshToken      String?
  expiresAt         DateTime
  isActive          Boolean  @default(true)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([tenantId, linkedinId])
  @@index([tenantId])
}

enum LinkedInProfileType {
  PERSONAL
  COMPANY_PAGE
}
```

### **API Endpoints:**

```
GET  /api/integrations/linkedin           → List all integrations
POST /api/integrations/linkedin/auth      → Start OAuth flow
GET  /api/integrations/linkedin/callback  → OAuth callback (saves all orgs)
DELETE /api/integrations/linkedin?id=xxx  → Disconnect integration

POST /api/posts/[id]/publish              → Publish to LinkedIn
  Body: { linkedInIntegrationId: "xxx" }
```

### **LinkedIn Client:**

```typescript
class LinkedInClient {
  constructor(
    accessToken: string,
    tenantId: string,
    organizationUrn?: string  // If posting to company
  )

  shareTextPost(text: string): Promise<LinkedInShareResponse>
  shareImagePost(text: string, imageUrl: string): Promise<LinkedInShareResponse>
  
  // Image upload: 3-step flow
  // 1. Register upload
  // 2. Upload binary
  // 3. Create share with asset URN
}
```

---

## 🚨 Common Issues

### **Issue: Organizations count: 0**

**Causes:**
1. Community Management API not approved yet
2. User doesn't have ADMINISTRATOR role on any page
3. Old token without new scopes

**Solution:** See [LINKEDIN_TROUBLESHOOTING.md](./LINKEDIN_TROUBLESHOOTING.md)

---

### **Issue: 403 Forbidden when publishing**

**Causes:**
1. Token doesn't have `w_organization_social` scope
2. User doesn't have ADMINISTRATOR role
3. Wrong organization URN

**Solution:** Check organization role in company page settings

---

### **Issue: Dropdown doesn't appear**

**Causes:**
1. Frontend not fetching integrations
2. API returning empty array
3. JavaScript error in console

**Solution:** Check browser console for errors, verify API response

---

## 📞 Support

### **LinkedIn Support:**
- Developer Portal: https://www.linkedin.com/developers/apps
- Help Center: https://www.linkedin.com/help/linkedin
- API Support: https://linkedin.zendesk.com/hc/en-us

### **Our Documentation:**
- 🆕 New App Setup: `LINKEDIN_NEW_APP_SETUP.md`
- 🔧 Troubleshooting: `LINKEDIN_TROUBLESHOOTING.md`
- 🔍 Scopes Setup: `LINKEDIN_SCOPES_SETUP.md`
- 📖 Technical Docs: `LINKEDIN_MULTIPLE_PROFILES.md`

---

## 🎉 Success Criteria

Feature is **READY** when:

✅ User can connect Personal Profile + Multiple Company Pages  
✅ Settings shows all connections with correct badges  
✅ Post Edit dropdown lists all profiles  
✅ User can select destination per post  
✅ Publishing works for all profiles (Personal + Companies)  
✅ Images upload and display correctly  
✅ No console errors or warnings  
✅ Railway logs show successful operations  

---

## 📅 Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| **Development** | ✅ Complete | Backend, Frontend, DB done |
| **LinkedIn App Setup** | 15 min | ⏳ User action required |
| **LinkedIn Review** | 24-48h | ⏳ Awaiting approval |
| **Railway Update** | 5 min | ⏳ After approval |
| **Testing** | 30 min | ⏳ After approval |
| **Production** | Live | ⏳ After testing |

---

## 🏆 Final Checklist

Before considering feature complete:

- [ ] LinkedIn app has Community Management API approved
- [ ] Railway Variables updated with new credentials
- [ ] User tested: Connect LinkedIn → 4+ profiles appear
- [ ] User tested: Publish to personal profile → Success
- [ ] User tested: Publish to company page → Success
- [ ] User tested: Images appear correctly
- [ ] No errors in Railway logs
- [ ] No errors in browser console
- [ ] Documentation reviewed and understood

---

**Last Updated:** 2026-01-02  
**Version:** 1.0  
**Status:** Code Ready - Awaiting LinkedIn Approval

**All code is deployed and ready. Only pending: LinkedIn Community Management API approval.**

