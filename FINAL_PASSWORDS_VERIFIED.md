# 🔐 FINAL USER PASSWORDS - VERIFIED WORKING

**Last Updated:** 2026-01-03  
**Status:** ✅ ALL PASSWORDS VERIFIED IN DATABASE  
**Branch:** genspark_fix_password_23  
**PR:** #10

---

## 📋 ACTIVE USER CREDENTIALS

### 1. Admin Account
```
Email:    admin@mindloop.ro
Password: TtHMHQdGXj8b
Role:     TENANT_ADMIN
Tenant:   BLUE LINE SRL SRL
Status:   ✅ VERIFIED WORKING
```

### 2. Editor Account
```
Email:    editor@mindloop.ro
Password: AIeasAUh*Lo6
Role:     EDITOR
Tenant:   BLUE LINE SRL SRL
Status:   ✅ VERIFIED WORKING
```

### 3. Super Admin Account
```
Email:    superadmin@mindloop.ro
Password: yKKDT85uYu1R
Role:     SUPER_ADMIN
Tenant:   (Access to all tenants)
Status:   ✅ VERIFIED WORKING
```

### 4. Demo Account (LinkedIn Team)
```
Email:    demo@mindloop.ro
Password: Linkedin2025!!
Role:     TENANT_ADMIN
Tenant:   BLUE LINE SRL SRL
Status:   ✅ VERIFIED WORKING
Note:     ⚠️ FIXED PASSWORD - Shared with LinkedIn team, DO NOT CHANGE!
```

---

## 🌐 Login URL

**Production:** https://socialai.mindloop.ro/login

---

## ✅ Verification

All passwords have been verified using bcrypt comparison against database hashes.
Test run timestamp: 2026-01-03

**Verification script:** `scripts/verify-all-passwords.js`

---

## 🔒 Security Notes

1. **Hashing:** All passwords stored as bcrypt hashes (cost factor 10)
2. **Email Verified:** All accounts marked as email verified
3. **Demo Password:** `demo@mindloop.ro` uses FIXED password `Linkedin2025!!` - shared with LinkedIn integration team
4. **Other Passwords:** Can be changed by users after first login

---

## 🛠️ Maintenance Scripts

### Verify passwords still work:
```bash
cd /home/user/webapp
export DATABASE_URL="your-database-url"
node scripts/verify-all-passwords.js
```

### Regenerate passwords (except demo):
```bash
node scripts/set-user-passwords.js
```

### Set demo password specifically:
```bash
node scripts/set-demo-password.js
```

---

## 📝 Quick Copy-Paste

```
admin@mindloop.ro       → TtHMHQdGXj8b
editor@mindloop.ro      → AIeasAUh*Lo6
superadmin@mindloop.ro  → yKKDT85uYu1R
demo@mindloop.ro        → Linkedin2025!!
```

---

## ⚠️ IMPORTANT REMINDERS

1. **Demo Password is FIXED** - Do not regenerate randomly for `demo@mindloop.ro`
2. **LinkedIn Team Access** - The demo account credentials are shared with LinkedIn for integration testing
3. **Coordinate Changes** - If database is reset, re-run password scripts
4. **Secure Storage** - Store this document in a secure password manager
5. **Delete After Distribution** - Delete this file from repository after all users have their passwords

---

✅ **ALL SYSTEMS READY - LOGIN SHOULD WORK NOW!**
