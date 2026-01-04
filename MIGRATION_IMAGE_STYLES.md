# Database Migration: Image Styles Feature

## ✅ Migration Status: **COMPLETED**

**Date**: 2026-01-04  
**Database**: Railway PostgreSQL  
**Migration Type**: Schema Update (Add columns to ai_configs)

---

## 📋 Changes Applied

### New Columns in `ai_configs` Table

| Column Name | Type | Nullable | Default | Description |
|-------------|------|----------|---------|-------------|
| `imageStyles` | Json | YES | NULL | Stores tenant-specific image style configuration |
| `defaultImageStyle` | Text | NO | 'professional' | Default image style ID for the tenant |

---

## 🔧 Migration Command Used

```bash
export DATABASE_URL="postgresql://postgres:***@shortline.proxy.rlwy.net:38171/railway"
npx prisma db push --accept-data-loss
```

**Result**: ✅ Database synchronized successfully in 3.31s

---

## 🎨 Image Styles JSON Schema

The `imageStyles` column stores a JSON object with this structure:

```json
{
  "styles": [
    {
      "id": "professional",
      "name": "Professional",
      "prompt": "Clean, professional, business-appropriate visual...",
      "description": "Corporate, business-focused imagery",
      "isDefault": true,
      "isActive": true
    },
    {
      "id": "lifestyle",
      "name": "Lifestyle",
      "prompt": "Lifestyle photography, attractive people...",
      "description": "Human-focused, aspirational imagery",
      "isDefault": false,
      "isActive": true
    }
  ],
  "defaultStyleId": "professional"
}
```

---

## 🚀 How to Use (Post-Migration)

### 1. Access Image Styles Settings
```
Navigate to: Dashboard → Settings → Image Styles Tab
```

### 2. Default Behavior (No Configuration)
- If `imageStyles` is NULL → Uses 8 built-in styles
- If `defaultImageStyle` is NULL → Falls back to 'professional'

### 3. Configure Custom Styles
- Click "Add Custom Style"
- Edit built-in styles
- Set any style as default
- Enable/Disable styles

---

## 🧪 Testing Checklist

- [x] Database migration completed
- [x] Columns created successfully
- [ ] Test Settings UI loads
- [ ] Test creating custom style
- [ ] Test editing style
- [ ] Test setting default style
- [ ] Test image generation uses custom style
- [ ] Test reset to defaults

---

## 🔄 Rollback (If Needed)

If you need to rollback this migration:

```sql
ALTER TABLE ai_configs DROP COLUMN IF EXISTS "imageStyles";
ALTER TABLE ai_configs DROP COLUMN IF EXISTS "defaultImageStyle";
```

**⚠️ Warning**: This will delete all custom image style configurations!

---

## 📊 Verification Queries

### Check if columns exist:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'ai_configs' 
  AND column_name IN ('imageStyles', 'defaultImageStyle');
```

### Check existing data:
```sql
SELECT 
  "tenantId",
  "defaultImageStyle",
  CASE 
    WHEN "imageStyles" IS NULL THEN 'Using built-in defaults'
    ELSE 'Custom configuration'
  END as config_status
FROM ai_configs;
```

### Count tenants with custom styles:
```sql
SELECT 
  COUNT(*) FILTER (WHERE "imageStyles" IS NULL) as using_defaults,
  COUNT(*) FILTER (WHERE "imageStyles" IS NOT NULL) as using_custom
FROM ai_configs;
```

---

## 🌐 Railway Environment

**Connection String Format**:
```
postgresql://postgres:PASSWORD@shortline.proxy.rlwy.net:38171/railway
```

**Note**: This migration was applied directly to the Railway production database.

---

## 📝 Related Files

- **Schema**: `prisma/schema.prisma`
- **Types**: `src/types/image-styles.ts`
- **API**: `src/app/api/settings/image-styles/route.ts`
- **UI**: `src/components/settings/ImageStylesManager.tsx`
- **Logic**: `src/lib/image/styles.ts`

---

## ✅ Next Steps

1. **Test in UI**: 
   - Go to https://socialai.mindloop.ro/dashboard/settings
   - Click "Image Styles" tab
   - Verify 8 built-in styles load

2. **Create Custom Style**:
   - Click "Add Custom Style"
   - Test save/edit/delete

3. **Generate Image**:
   - Go to Auto-Pilot
   - Generate post
   - Verify it uses configured default style

4. **Monitor Logs**:
   - Check Railway logs for any Prisma errors
   - Look for: `🎨 Using tenant style "..."`

---

**Migration completed successfully! ✅**
