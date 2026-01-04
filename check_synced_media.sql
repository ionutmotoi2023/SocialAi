-- Check synced media in database
SELECT 
  id,
  originalFileName,
  localUrl,
  mediaType,
  processingStatus,
  tenantId,
  syncedAt
FROM synced_media
WHERE tenantId = 'cmjy31n0e0000vsg43qjrd21l'
ORDER BY syncedAt DESC
LIMIT 10;
