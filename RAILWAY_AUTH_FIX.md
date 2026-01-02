# 🔐 Authentication Issue - 401 Unauthorized

## Problem
Login fails with **401 Unauthorized** error because the database doesn't have any users.

## Root Cause
The seed script (`npx prisma db seed`) hasn't been run on the production database.

---

## ✅ Solution - Run Setup on Railway

### Option 1: Railway CLI (Recommended)

```bash
# Login to Railway
railway login

# Link to your project
railway link

# Run the setup script
railway run bash scripts/setup-database.sh
```

### Option 2: Railway Dashboard

1. Go to your Railway project: https://railway.app/
2. Select your project: **SocialAI**
3. Go to **Settings** → **Deployments**
4. Add a **Build Command** or **Post-Deploy** script:

```bash
npx prisma generate && npx prisma db push --accept-data-loss && npx prisma db seed
```

5. Redeploy the application

### Option 3: Manual Database Shell

1. Go to Railway Dashboard → Your Database
2. Open **Data** tab or **Query** tab
3. Run the seed script manually through Railway's console

---

## 🔑 Default Login Credentials (After Seed)

### 🛡️ **SUPER ADMIN** (Can manage ALL tenants)
```
Email: superadmin@mindloop.ro
Password: (any password works - demo mode)
Access: /dashboard/super-admin
```

### 👤 **TENANT ADMIN** (AI MINDLOOP SRL tenant)
```
Email: admin@mindloop.ro
Password: (any password works - demo mode)
Access: /dashboard
```

### ✏️ **EDITOR** (AI MINDLOOP SRL tenant)
```
Email: editor@mindloop.ro
Password: (any password works - demo mode)
Access: /dashboard (limited permissions)
```

---

## 🔍 Verify Database Has Users

After running the seed, you can verify users exist:

### Via Railway Console:
```bash
railway run npx prisma studio
```

### Via SQL Query (Railway Data Tab):
```sql
SELECT email, name, role, "tenantId" FROM users;
```

Expected output:
```
superadmin@mindloop.ro | Super Administrator | SUPER_ADMIN | NULL
admin@mindloop.ro      | Admin User          | TENANT_ADMIN | demo-tenant-id
editor@mindloop.ro     | Editor User         | EDITOR       | demo-tenant-id
```

---

## 🚨 Important Notes

1. **Demo Mode Authentication:**
   - File: `src/lib/auth.ts` (line 73)
   - Current setting: `const isPasswordValid = true`
   - **ANY password is accepted** for demo purposes
   - In production, you should implement proper bcrypt password hashing

2. **Seed Script Location:**
   - `prisma/seed.ts` - Creates 3 users + 1 tenant + AI config + 3 demo posts

3. **Schema Changes:**
   - If you modify `prisma/schema.prisma`, run:
   ```bash
   railway run npx prisma db push
   railway run npx prisma db seed
   ```

---

## 🐛 Troubleshooting

### Still getting 401 after seed?

Check the application logs on Railway:

```bash
railway logs
```

Look for authentication errors like:
- `Invalid email or password`
- `User not found`
- Database connection errors

### Database connection issues?

Verify `DATABASE_URL` environment variable is set:

```bash
railway variables
```

Should show:
```
DATABASE_URL=postgresql://...
```

### Need to reset database?

⚠️ **WARNING: This will delete all data!**

```bash
railway run npx prisma migrate reset --force
railway run npx prisma db seed
```

---

## 📞 Support

If you continue to have authentication issues:

1. Check Railway logs: `railway logs`
2. Verify environment variables in Railway Dashboard
3. Ensure database is accessible
4. Check Prisma Client is generated: `npx prisma generate`

---

## 🎯 Quick Fix Summary

**Run this on Railway to fix 401 error:**

```bash
railway run bash scripts/setup-database.sh
```

Then try logging in with:
- Email: `superadmin@mindloop.ro` or `admin@mindloop.ro`
- Password: `anything` (any text works in demo mode)

✅ Done!
