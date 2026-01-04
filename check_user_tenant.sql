-- Check user's tenantId
SELECT 
  u.id as user_id,
  u.email,
  u.tenantId,
  t.name as tenant_name,
  t.domain as tenant_domain
FROM "User" u
LEFT JOIN "Tenant" t ON u.tenantId = t.id
WHERE u.email = 'ionut.motoi@siteq.ro';

-- Check synced media for this tenant
SELECT 
  sm.id,
  sm.tenantId,
  sm.originalFileName,
  sm.localUrl,
  sm.processingStatus,
  sm.syncedAt,
  sm.createdAt
FROM synced_media sm
WHERE sm.tenantId IN (
  SELECT tenantId FROM "User" WHERE email = 'ionut.motoi@siteq.ro'
)
ORDER BY COALESCE(sm.syncedAt, sm.createdAt) DESC
LIMIT 10;
