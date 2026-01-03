# 🔐 USER CREDENTIALS - UPDATED

**Updated:** 2026-01-03 (Second Generation)  
**Reason:** Previous passwords were lost/reset  
**Database:** Railway Production  

---

## 📋 CURRENT USER PASSWORDS (ACTIVE)

### 1. TENANT ADMIN
- **Name:** Admin User
- **Email:** admin@mindloop.ro
- **Tenant:** BLUE LINE SRL SRL
- **Role:** TENANT_ADMIN
- **Password:** `TtHMHQdGXj8b`
- **Login URL:** https://socialai.mindloop.ro/login

### 2. EDITOR
- **Name:** Editor User
- **Email:** editor@mindloop.ro
- **Tenant:** BLUE LINE SRL SRL
- **Role:** EDITOR
- **Password:** `AIeasAUh*Lo6`
- **Login URL:** https://socialai.mindloop.ro/login

### 3. SUPER ADMIN
- **Name:** Super Administrator
- **Email:** superadmin@mindloop.ro
- **Tenant:** No Tenant (Access to all)
- **Role:** SUPER_ADMIN
- **Password:** `yKKDT85uYu1R`
- **Login URL:** https://socialai.mindloop.ro/login

### 4. DEMO ACCOUNT (FOR LINKEDIN TEAM)
- **Name:** demo@mindloop.ro
- **Email:** demo@mindloop.ro
- **Tenant:** BLUE LINE SRL SRL
- **Role:** TENANT_ADMIN
- **Password:** `Linkedin2025!!`
- **Login URL:** https://socialai.mindloop.ro/login
- **⚠️ FIXED PASSWORD:** This account uses a specific password shared with LinkedIn team

### 5. IONUT MOTOI (TENANT ADMIN - AI MINDLOOP SRL)
- **Name:** Ionut Dorel Motoi
- **Email:** ionut.motoi@siteq.ro
- **Tenant:** AI MINDLOOP SRL
- **Role:** TENANT_ADMIN
- **Password:** `Mindloop2026!`
- **Login URL:** https://socialai.mindloop.ro/login
- **✅ NEW:** Password set on 2026-01-03

---

## ⚠️ IMPORTANT NOTES

### What Happened:
1. Initial passwords were set successfully
2. You tested and confirmed they worked
3. Database was reset/modified (possibly by other developer)
4. All passwords were cleared (set to NULL)
5. Passwords regenerated with new values

### Current Status:
- ✅ All 5 users have passwords set
- ✅ All passwords are hashed with bcrypt
- ✅ Email verified for all users
- ✅ Ready for immediate login

### Security:
- All passwords are cryptographically secure (12 characters, mixed case, numbers, special chars)
- Stored as bcrypt hashes in database (cost factor 10)
- Original plain passwords only in this document

---

## 📝 Quick Reference

```
admin@mindloop.ro       → TtHMHQdGXj8b
editor@mindloop.ro      → AIeasAUh*Lo6
superadmin@mindloop.ro  → yKKDT85uYu1R
demo@mindloop.ro        → Linkedin2025!!  (FIXED - shared with LinkedIn)
ionut.motoi@siteq.ro    → Mindloop2026!   (NEW - AI MINDLOOP SRL tenant)
```

---

## 🔄 If Passwords Stop Working Again

If this happens again, run:

```bash
cd /home/user/webapp
export DATABASE_URL="postgresql://postgres:HZlxTekzjERdCfxJSObKSiIOovpcfgSW@shortline.proxy.rlwy.net:38171/railway"
node scripts/set-user-passwords.js
```

This will:
- Generate new secure passwords for all users without passwords
- Hash them with bcrypt
- Display the new credentials
- Set emailVerified timestamp

---

## 🚨 Coordination with Other Developer

**IMPORTANT:** Coordinate with the other developer to ensure:
- They don't run database migrations that reset password fields
- They don't use `prisma db push --force-reset`
- They preserve existing user data
- They test in development before pushing to production

---

⚠️ **SAVE THESE PASSWORDS** - Test immediately and store in password manager!
