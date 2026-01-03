# 🚀 Auto-Pilot Drive Sync - Implementation Progress

## ✅ COMPLETAT

### Etapa 1: Database Schema ✅
- [x] CloudStorageIntegration model
- [x] SyncedMedia model  
- [x] MediaGroup model
- [x] AutoPilotConfig extensions (grouping rules)
- [x] Post model extensions (mediaGroup relations)
- [x] Prisma generate successful

### Etapa 2: Google Drive OAuth ✅
- [x] Install googleapis package
- [x] Google Drive client library
- [x] OAuth2 authentication flow
- [x] `/api/integrations/google-drive/connect` endpoint
- [x] `/api/integrations/google-drive/callback` endpoint
- [x] `/api/integrations/google-drive/disconnect` endpoint
- [x] `/api/integrations/google-drive/status` endpoint
- [x] Token refresh handling
- [x] Environment variables added to .env.example

---

## 🔄 ÎN CURS / URMĂTOARELE ETAPE

### Etapa 3: CRON Job - Sync Media
📁 Fișier: `src/app/api/cron/sync-cloud-storage/route.ts`

**Funcționalitate:**
- Rulează la fiecare 15 minute
- Find toate CloudStorageIntegration cu isActive = true
- Pentru fiecare integrare:
  - Refresh token dacă e expirat
  - List files noi din syncFolderPath
  - Filter doar imagini/video (MIME types)
  - Check dacă file nu e deja în SyncedMedia (by originalFileId)
  - Pentru fiecare fișier nou:
    - Download de la Drive
    - Upload la Cloudinary
    - Create SyncedMedia entry (status = PENDING)
  - Update lastSyncedAt

**Cod de implementat:**
```typescript
// TODO: Implementează logica de sync
// 1. Get active integrations
// 2. For each integration:
//    - Refresh token if needed
//    - List new files
//    - Download → Cloudinary
//    - Create SyncedMedia
```

---

### Etapa 4: CRON Job - Analyze Media
📁 Fișier: `src/app/api/cron/analyze-synced-media/route.ts`

**Funcționalitate:**
- Rulează la fiecare 10 minute
- Find SyncedMedia cu status = PENDING
- Pentru fiecare media:
  - Folosește GPT-4o Vision pentru analiză
  - Extract: description, topics, mood, objects, context
  - Save în aiAnalysisResult JSON
  - Update aiSuggestedTopics, aiDetectedObjects, aiMood, aiContext
  - Update status = ANALYZED

**Prompt GPT-4o:**
```
Analyze this image for social media posting. Extract:
1. Description (what's in the image)
2. Main topics/themes (3-5 topics)
3. Mood/emotion (professional, casual, exciting, etc.)
4. Detected objects (people, products, locations, etc.)
5. Context (meeting, event, product demo, etc.)

Return as JSON with keys: description, topics[], mood, objects[], context
```

---

### Etapa 5: CRON Job - Group Media
📁 Fișier: `src/app/api/cron/group-media/route.ts`

**Funcționalitate:**
- Rulează la fiecare 20 minute
- Find SyncedMedia cu status = ANALYZED și isGrouped = false
- Apply grouping rules din AutoPilotConfig:
  - RULE 1: Same Day (toate uploadate în aceeași zi)
  - RULE 2: Sequential Upload (în X ore)
  - RULE 3: Similar Topics (similarity threshold)
  - RULE 4: Event Detection (keywords matching)
  - RULE 5: Folder-based (același folder Drive)
- Create MediaGroup entries
- Link media la group (update mediaGroupId, groupOrder)
- Set group status = READY_FOR_POST

**Algoritm de grupare:**
```typescript
function smartGroupMedia(media: SyncedMedia[], config: AutoPilotConfig) {
  const groups = []
  
  if (config.sameDayGrouping) {
    groups.push(...groupBySameDay(media))
  }
  
  if (config.sequentialGrouping) {
    groups.push(...groupBySequential(media, config.sequentialTimeWindow))
  }
  
  if (config.similarTopicsGrouping) {
    groups.push(...groupBySimilarTopics(media, config.topicSimilarityThreshold))
  }
  
  // ... alte reguli
  
  return mergeOverlappingGroups(groups)
}
```

---

### Etapa 6: CRON Job - Auto-Generate Posts
📁 Fișier: `src/app/api/cron/auto-generate-from-drive/route.ts`

**Funcționalitate:**
- Rulează la fiecare 30 minute
- Find MediaGroup cu status = READY_FOR_POST
- Pentru fiecare group:
  - Aggregate context din toate media
  - Generate content cu GPT-4o bazat pe analiza imaginilor
  - Create Post cu:
    - mediaUrls = toate URL-urile din group
    - mediaOrder = ordine optimă (chronological sau story-based)
    - status = SCHEDULED sau PENDING_APPROVAL (based on confidence)
    - scheduledAt = getNextAvailableSlot() (dacă auto-approved)
  - Update MediaGroup.status = POSTED
  - Link media la post (postId)

**Prompt GPT-4o pentru generare:**
```
Create a LinkedIn post based on these ${mediaCount} images:

Image 1: ${media[0].aiDescription}
Topics: ${media[0].aiSuggestedTopics}
Mood: ${media[0].aiMood}

Image 2: ${media[1].aiDescription}
...

Common themes: ${group.commonTopics}
Overall theme: ${group.detectedTheme}

Create an engaging post that tells a cohesive story connecting all images.
Include: brand voice, hashtags, CTA.
```

---

### Etapa 7: Update vercel.json
📁 Fișier: `vercel.json`

**Adaugă noile CRON jobs:**
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-cloud-storage",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/analyze-synced-media",
      "schedule": "*/10 * * * *"
    },
    {
      "path": "/api/cron/group-media",
      "schedule": "*/20 * * * *"
    },
    {
      "path": "/api/cron/auto-generate-from-drive",
      "schedule": "*/30 * * * *"
    },
    {
      "path": "/api/cron/publish-scheduled",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

---

### Etapa 8: UI - Settings Page
📁 Fișier: `src/app/dashboard/settings/integrations/page.tsx`

**Componentă nouă:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Cloud Storage Sync</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Google Drive Connection */}
    <DriveConnectionCard 
      connected={driveConnected}
      onConnect={connectDrive}
      onDisconnect={disconnectDrive}
    />
    
    {driveConnected && (
      <>
        {/* Settings */}
        <DriveSyncSettings config={driveConfig} onChange={updateDriveConfig} />
        
        {/* Grouping Guidelines */}
        <MediaGroupingRules config={autopilotConfig} onChange={updateAutopilot} />
      </>
    )}
  </CardContent>
</Card>
```

---

### Etapa 9: UI - Synced Media Page
📁 Fișier: `src/app/dashboard/drive-media/page.tsx`

**Funcționalitate:**
- List toate SyncedMedia pentru tenant
- Filter by status (PENDING, ANALYZED, GENERATED)
- Show preview thumbnails
- Display AI analysis results
- Link to generated posts
- Manual skip/retry options

---

### Etapa 10: UI - Media Groups Page
📁 Fișier: `src/app/dashboard/media-groups/page.tsx`

**Funcționalitate:**
- List toate MediaGroup pentru tenant
- Show grouped media previews
- Display grouping reason și confidence
- Show generated post (dacă există)
- Manual edit/split/merge groups

---

## 📝 Fișiere Helper Necesare

### 1. GPT-4o Vision Analysis
📁 `src/lib/ai/analyze-media.ts`
```typescript
export async function analyzeMediaWithGPT4o(imageUrl: string) {
  // Call GPT-4o with image_url
  // Extract structured analysis
  // Return: description, topics, mood, objects, context
}
```

### 2. Grouping Algorithms
📁 `src/lib/grouping/algorithms.ts`
```typescript
export function groupBySameDay(media: SyncedMedia[]): MediaGroupProposal[]
export function groupBySequential(media: SyncedMedia[], hours: number): MediaGroupProposal[]
export function groupBySimilarTopics(media: SyncedMedia[], threshold: number): MediaGroupProposal[]
export function detectEvents(media: SyncedMedia[], keywords: string[]): MediaGroupProposal[]
```

### 3. Content Generation from Groups
📁 `src/lib/ai/generate-from-group.ts`
```typescript
export async function generateContentFromMediaGroup(
  group: MediaGroup,
  media: SyncedMedia[],
  aiConfig: AIConfig
): Promise<GeneratedContent>
```

---

## 🎯 Testing Checklist

- [ ] Google Drive OAuth flow (connect → callback → save tokens)
- [ ] Token refresh when expired
- [ ] Sync new files from Drive
- [ ] GPT-4o Vision analysis accuracy
- [ ] Grouping rules (test each rule independently)
- [ ] Post generation from groups
- [ ] Auto-approval logic (confidence threshold)
- [ ] Scheduling integration (getNextAvailableSlot)
- [ ] Calendar display (grouped posts)
- [ ] LinkedIn publishing (multiple images)

---

## 📦 Deployment Checklist

- [ ] Add GOOGLE_DRIVE_CLIENT_ID to Railway env vars
- [ ] Add GOOGLE_DRIVE_CLIENT_SECRET to Railway env vars
- [ ] Run `prisma db push` to create new tables
- [ ] Verify CRON jobs are enabled in Railway
- [ ] Test OAuth callback URL matches deployment
- [ ] Monitor CRON job logs
- [ ] Test end-to-end flow with real Drive folder

---

## 💡 Optimizări Viitoare

1. **Batch Processing**: Process multiple images în paralel
2. **Webhook Support**: Real-time sync când se uploadează în Drive
3. **Video Support**: Frame extraction + GPT-4o analysis
4. **OneDrive Integration**: Similar flow cu Microsoft Graph API
5. **Dropbox Integration**: Similar cu Drive API
6. **Manual Grouping UI**: Drag & drop pentru grupare manuală
7. **Group Templates**: Predefined grupuri (Before/After, Timeline, etc.)
8. **Smart Ordering**: AI decide cea mai bună ordine a imaginilor
9. **Caption Suggestions**: AI generează multiple variante de caption
10. **A/B Testing**: Track care grupuri performează mai bine

---

## 🐛 Known Limitations

1. **Sync Delay**: 15 minute între upload și procesare (CRON frequency)
2. **File Size Limits**: Cloudinary free tier = 10MB/file
3. **API Rate Limits**: Google Drive API = 1000 requests/100s/user
4. **GPT-4o Vision Cost**: $0.01/image (high-res analysis)
5. **Video Processing**: Deocamdată doar imagini (video = coming soon)

---

## 📊 Progress: 2/10 Complete (20%)

✅ Database Schema
✅ Google Drive OAuth
🔄 CRON Jobs (0/4)
🔄 UI Pages (0/3)
🔄 Helper Libraries (0/3)
🔄 Testing
🔄 Deployment

**Estimated remaining time: 9 hours**

---

**Next Steps:**
1. Implementează CRON job pentru sync (Etapa 3)
2. Implementează CRON job pentru analyze (Etapa 4)
3. Implementează CRON job pentru grouping (Etapa 5)
4. Implementează CRON job pentru auto-generate (Etapa 6)
5. Update UI pentru Drive settings
6. Testing end-to-end

**Vrei să continui cu Etapa 3 (Sync CRON job)?** 🚀
