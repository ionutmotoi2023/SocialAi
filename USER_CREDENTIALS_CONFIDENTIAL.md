# 🔐 USER CREDENTIALS - CONFIDENTIAL

**Generated:** 2026-01-03  
**Database:** Railway Production  
**Action:** Password setup for existing users

---

## 📋 USER ACCOUNTS WITH NEW PASSWORDS

### 1. TENANT ADMIN
- **Name:** Admin User
- **Email:** admin@mindloop.ro
- **Tenant:** BLUE LINE SRL SRL
- **Role:** TENANT_ADMIN
- **Password:** `X@TeXC1H*^1C`
- **Login URL:** https://socialai.mindloop.ro/login

### 2. EDITOR
- **Name:** Editor User
- **Email:** editor@mindloop.ro
- **Tenant:** BLUE LINE SRL SRL
- **Role:** EDITOR
- **Password:** `k@$KE6MFFChK`
- **Login URL:** https://socialai.mindloop.ro/login

### 3. SUPER ADMIN
- **Name:** Super Administrator
- **Email:** superadmin@mindloop.ro
- **Tenant:** No Tenant (Access to all)
- **Role:** SUPER_ADMIN
- **Password:** `k*k8yhJL#Sq3`
- **Login URL:** https://socialai.mindloop.ro/login

---

## 🔒 Security Notes

1. **Password Hashing:** All passwords are hashed with bcrypt (cost factor 10) before storage
2. **Email Verified:** All users have been marked as email verified
3. **Secure Generation:** Passwords generated using cryptographically secure random method
4. **Immediate Login:** Users can login immediately with these credentials
5. **Change Password:** Users can change their passwords after first login via profile settings

---

## 📝 Important Actions

### For You:
- [ ] Share passwords securely with respective users (encrypted email, password manager, etc.)
- [ ] Delete this file after passwords are distributed
- [ ] Advise users to change passwords after first login
- [ ] Store backup copy in secure password manager

### For Users:
- [ ] Login with provided credentials
- [ ] Change password immediately via Profile → Settings
- [ ] Enable 2FA if available (future feature)
- [ ] Never share credentials

---

## 🔄 Password Reset

If any user forgets their password, you can run the password reset script:

```bash
cd /home/user/webapp
export DATABASE_URL="your-database-url"
node scripts/set-user-passwords.js
```

Or reset individual user password via Prisma Studio or database console.

---

## 📊 Pull Request

**PR #10:** https://github.com/ionutmotoi2023/SocialAi/pull/10
- Contains all password authentication fixes
- Database migration already applied
- Ready for merge and deployment

---

⚠️ **CONFIDENTIAL DOCUMENT - DELETE AFTER USE** ⚠️

This file contains sensitive credentials. Store securely and delete after passwords are distributed to users.
