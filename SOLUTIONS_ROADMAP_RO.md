# 🚀 Soluții și Roadmap - Social Media AI SaaS

## 📅 Data: 2 Ianuarie 2026

## 📊 Status Analiză Cod

Am analizat în profunzime structura aplicației și am identificat soluțiile necesare pentru toate problemele menționate.

---

## 🔴 PROBLEMA 1: Buton Publish lipsă din Draft Posts

### 📍 Status Actual
- În pagina `/dashboard/posts/[id]/page.tsx` există doar butonul **Save Changes**
- Nu există opțiunea de a publica direct sau a duce în calendar o postare draft
- Utilizatorul trebuie să navigheze manual în calendar pentru a programa

### ✅ Soluție Propusă

#### A) Adăugare butoane în pagina Edit Post (`/dashboard/posts/[id]/page.tsx`)

```typescript
// Adaugă în HeaderActions (linia ~217):
<div className="flex items-center gap-3">
  {getStatusBadge(post.status)}
  
  {/* NOU: Butoane pentru Draft posts */}
  {post.status === 'DRAFT' && (
    <>
      <Button
        variant="outline"
        onClick={handleSchedule}
        disabled={isSaving}
      >
        <Calendar className="mr-2 h-4 w-4" />
        Schedule
      </Button>
      
      <Button
        onClick={handlePublishNow}
        disabled={isPublishing}
        className="bg-green-600 hover:bg-green-700"
      >
        {isPublishing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Publishing...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Publish Now
          </>
        )}
      </Button>
    </>
  )}
  
  <Button
    variant="outline"
    onClick={handleDelete}
    disabled={isDeleting}
  >
    {/* Existing delete button */}
  </Button>
  
  <Button onClick={handleSave} disabled={isSaving}>
    {/* Existing save button */}
  </Button>
</div>
```

#### B) Funcții de publicare

```typescript
// Publish Now - Publică imediat
const handlePublishNow = async () => {
  setIsPublishing(true)
  
  try {
    // 1. Salvează modificările curente
    await handleSave()
    
    // 2. Publică postarea
    const response = await fetch(`/api/posts/${params.id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publishNow: true })
    })

    if (!response.ok) {
      throw new Error('Failed to publish post')
    }

    toast({
      title: 'Success',
      description: 'Post published successfully on LinkedIn',
    })

    // Refresh data
    fetchPost()
  } catch (error: any) {
    toast({
      title: 'Error',
      description: error.message || 'Failed to publish post',
      variant: 'destructive',
    })
  } finally {
    setIsPublishing(false)
  }
}

// Schedule - Deschide modal pentru programare
const handleSchedule = async () => {
  // 1. Salvează modificările
  await handleSave()
  
  // 2. Redirect la calendar cu postarea selectată
  router.push(`/dashboard/calendar?postId=${params.id}`)
}
```

#### C) Modificări în API `/api/posts/[id]/publish/route.ts`

```typescript
// Adaugă parametru publishNow
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { publishNow } = await request.json()
    const postId = params.id

    // Get post
    const post = await prisma.post.findUnique({
      where: { id: postId, tenantId: session.user.tenantId }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (publishNow) {
      // Publică imediat pe LinkedIn
      const result = await publishToLinkedIn(post, session.user.tenantId)
      
      return NextResponse.json({
        success: true,
        message: 'Post published successfully',
        linkedinUrl: result.linkedinUrl
      })
    } else {
      // Schedule pentru mai târziu (existing logic)
      // ...
    }
  } catch (error) {
    console.error('Failed to publish post:', error)
    return NextResponse.json(
      { error: 'Failed to publish post' },
      { status: 500 }
    )
  }
}
```

### 📋 Pași de implementare:
1. ✅ Modifică `/src/app/dashboard/posts/[id]/page.tsx` - adaugă butoanele noi
2. ✅ Adaugă funcțiile `handlePublishNow` și `handleSchedule`
3. ✅ Modifică `/src/app/api/posts/[id]/publish/route.ts` pentru `publishNow`
4. ✅ Testează workflow-ul complet: Draft → Publish Now / Schedule

---

## 🔴 PROBLEMA 2: Website-ul firmei pentru AI Training

### 📍 Status Actual
- În `prisma/schema.prisma` există:
  - `Tenant.website` - dar nu e folosit pentru training
  - `Tenant.description` - dar nu e scraping
  - `ContentSource` model - există dar nu e folosit

### ✅ Soluție Propusă

#### A) Adaugă configurare în Settings (`/dashboard/settings`)

```typescript
// Nou tab în Settings: "Brand Training"
interface BrandTrainingSettings {
  websiteUrl: string
  aboutPage: string
  productsPage: string
  newsPage: string
  scrapeEnabled: boolean
  scrapeFrequency: 'daily' | 'weekly' | 'monthly'
  brandVoiceExamples: string[]
}
```

#### B) Creează API endpoint pentru scraping website

```typescript
// /api/brand/scrape/route.ts
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const { websiteUrl } = await request.json()
  
  // 1. Scrape website folosind Cheerio sau Puppeteer
  const websiteContent = await scrapeWebsite(websiteUrl)
  
  // 2. Extrage text relevant
  const extractedText = {
    aboutUs: websiteContent.about,
    products: websiteContent.products,
    values: websiteContent.values,
    tone: analyzeWritingStyle(websiteContent)
  }
  
  // 3. Salvează în database pentru AI training
  await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: {
      description: extractedText.aboutUs,
      // Adaugă nou field: brandContext
    }
  })
  
  return NextResponse.json({ 
    success: true,
    extracted: extractedText 
  })
}
```

#### C) Integrează în AI Config

```typescript
// Când generezi conținut în /api/content/generate/route.ts
const systemPrompt = `
You are a social media content creator for ${tenant.name}.

BRAND CONTEXT:
- Company: ${tenant.name}
- Industry: ${tenant.industry}
- Website: ${tenant.website}
- About: ${tenant.description}

${aiConfig.brandVoice ? `BRAND VOICE: ${aiConfig.brandVoice}` : ''}

${brandTrainingData ? `
COMPANY BACKGROUND:
${brandTrainingData.aboutUs}

PRODUCTS/SERVICES:
${brandTrainingData.products}

COMPANY VALUES:
${brandTrainingData.values}
` : ''}

Generate content that reflects this brand's tone and values.
`
```

### 📋 Pași de implementare:
1. ✅ Creează nou model în Prisma: `BrandTrainingData`
2. ✅ Adaugă tab "Brand Training" în `/dashboard/settings`
3. ✅ Creează API `/api/brand/scrape` pentru web scraping
4. ✅ Integrează în `/api/content/generate` pentru prompt enhancement
5. ✅ Adaugă cron job pentru periodic scraping

---

## 🔴 PROBLEMA 3: RSS Feeds și News Sources pentru AI

### 📍 Status Actual
- Model `ContentSource` există în Prisma dar nu e folosit
- Nu există UI pentru adăugare RSS feeds
- AI nu utilizează external content pentru inspirație

### ✅ Soluție Propusă

#### A) Creează pagină pentru Content Sources

```typescript
// /dashboard/content-sources/page.tsx
interface ContentSource {
  id: string
  name: string
  type: 'rss' | 'website' | 'competitor' | 'news'
  url: string
  isActive: boolean
  lastChecked?: Date
  settings?: {
    keywords: string[]
    autoImport: boolean
  }
}

// UI pentru adăugare surse:
- RSS Feed Reader (ex: TechCrunch, Wired, industry blogs)
- Website Monitor (competitor websites)
- News Aggregators (Google News API)
```

#### B) Creează API pentru RSS parsing

```typescript
// /api/content-sources/fetch/route.ts
import Parser from 'rss-parser'

export async function POST(request: NextRequest) {
  const { sourceId } = await request.json()
  
  const source = await prisma.contentSource.findUnique({
    where: { id: sourceId }
  })
  
  if (source.type === 'rss') {
    const parser = new Parser()
    const feed = await parser.parseURL(source.url)
    
    // Salvează articole relevante
    const relevantArticles = feed.items
      .filter(item => matchesKeywords(item, source.settings.keywords))
      .slice(0, 10) // ultimele 10 articole
    
    // Stochează pentru AI reference
    await prisma.aILearningData.createMany({
      data: relevantArticles.map(article => ({
        tenantId: source.tenantId,
        interactionType: 'content_inspiration',
        originalContent: article.contentSnippet,
        patternDetected: `External: ${article.title}`
      }))
    })
    
    return NextResponse.json({ 
      imported: relevantArticles.length 
    })
  }
}
```

#### C) Integrează în Auto-Pilot

```typescript
// În /api/autopilot/generate/route.ts
// Înainte de a genera post, fetch inspiration:

const recentNews = await prisma.aILearningData.findMany({
  where: {
    tenantId,
    interactionType: 'content_inspiration',
    createdAt: {
      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // ultimele 7 zile
    }
  },
  take: 5,
  orderBy: { createdAt: 'desc' }
})

const prompt = `
Generate a social media post about: ${topic}

RECENT INDUSTRY NEWS FOR INSPIRATION:
${recentNews.map(n => `- ${n.patternDetected}: ${n.originalContent?.substring(0, 200)}`).join('\n')}

Create original content inspired by these trends, but don't copy them directly.
`
```

### 📋 Pași de implementare:
1. ✅ Creează UI `/dashboard/content-sources`
2. ✅ Implementează `/api/content-sources` CRUD
3. ✅ Adaugă `rss-parser` package: `npm install rss-parser`
4. ✅ Creează cron job pentru fetch RSS feeds (`/api/cron/fetch-feeds`)
5. ✅ Integrează în AI generation workflow

---

## 🔴 PROBLEMA 4: AI Learning din Modificările Utilizatorului

### 📍 Status Actual
- Model `AILearningData` există în Prisma
- Când user modifică post, nu se salvează ce a fost modificat
- AI nu învață din feedback

### ✅ Soluție Propusă

#### A) Tracking modificări în Edit Post

```typescript
// În /api/posts/[id]/route.ts (PUT method)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const { title, content, mediaUrls, scheduledAt } = await request.json()
  
  // 1. Obține postarea originală
  const originalPost = await prisma.post.findUnique({
    where: { id: params.id }
  })
  
  // 2. Detectează modificări
  const modifications = detectModifications(originalPost, {
    title,
    content,
    mediaUrls
  })
  
  // 3. Salvează pentru AI learning
  if (modifications.hasChanges && originalPost.aiGenerated) {
    await prisma.aILearningData.create({
      data: {
        tenantId: session.user.tenantId,
        postId: params.id,
        interactionType: 'user_edit',
        originalContent: originalPost.content,
        modifiedContent: content,
        userFeedback: generateFeedback(modifications),
        patternDetected: identifyPattern(modifications),
        improvementScore: calculateScore(modifications)
      }
    })
  }
  
  // 4. Update post cu tracking
  const updatedPost = await prisma.post.update({
    where: { id: params.id },
    data: {
      title,
      content,
      mediaUrls,
      scheduledAt,
      userModifications: JSON.stringify(modifications)
    }
  })
  
  return NextResponse.json(updatedPost)
}

// Helper functions
function detectModifications(original, modified) {
  return {
    hasChanges: original.content !== modified.content,
    lengthChanged: modified.content.length - original.content.length,
    toneChanged: detectToneChange(original.content, modified.content),
    hashtagsChanged: detectHashtagChanges(original.content, modified.content),
    emojiChanged: detectEmojiChanges(original.content, modified.content),
    structureChanged: detectStructureChange(original.content, modified.content)
  }
}

function identifyPattern(modifications) {
  const patterns = []
  
  if (modifications.lengthChanged > 100) patterns.push('User prefers longer content')
  if (modifications.lengthChanged < -100) patterns.push('User prefers shorter content')
  if (modifications.toneChanged) patterns.push(`Tone shift: ${modifications.toneChanged}`)
  if (modifications.hashtagsChanged) patterns.push('Hashtag strategy modified')
  
  return patterns.join('; ')
}
```

#### B) Utilizare learning data în generare

```typescript
// În /api/content/generate/route.ts
const learningData = await prisma.aILearningData.findMany({
  where: {
    tenantId: session.user.tenantId,
    interactionType: { in: ['user_edit', 'approval', 'rejection'] }
  },
  orderBy: { createdAt: 'desc' },
  take: 50 // ultimele 50 interacțiuni
})

// Analizează patterns
const patterns = analyzeLearningPatterns(learningData)

const enhancedPrompt = `
${basePrompt}

LEARNED PREFERENCES (based on ${learningData.length} interactions):
${patterns.preferredLength ? `- Preferred content length: ${patterns.preferredLength} words` : ''}
${patterns.preferredTone ? `- Preferred tone: ${patterns.preferredTone}` : ''}
${patterns.hashtagStrategy ? `- Hashtag strategy: ${patterns.hashtagStrategy}` : ''}
${patterns.commonModifications ? `- Common modifications: ${patterns.commonModifications}` : ''}

Generate content following these learned preferences.
`
```

#### C) Dashboard pentru Learning Analytics

```typescript
// /dashboard/ai-insights/page.tsx
- Arată ce a învățat AI din modificări
- Grafice: tone preference, length preference, hashtag usage
- Top patterns detected
- Improvement score over time
```

### 📋 Pași de implementare:
1. ✅ Modifică `/api/posts/[id]/route.ts` pentru tracking
2. ✅ Creează funcții de analiză: `detectModifications`, `identifyPattern`
3. ✅ Integrează learning în `/api/content/generate`
4. ✅ Creează `/dashboard/ai-insights` pentru vizualizare
5. ✅ Adaugă export learning data (pentru fine-tuning models)

---

## 🟡 PROBLEMA 5: Analiză Feed LinkedIn

### 📍 Status Actual
- Nu există funcționalitate de import posturi LinkedIn vechi
- AI nu poate învăța din postările anterioare ale user-ului

### ✅ Soluție Propusă

#### A) Import istoric LinkedIn posts

```typescript
// /api/integrations/linkedin/import-posts/route.ts
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  // 1. Get LinkedIn integration
  const integration = await prisma.linkedInIntegration.findUnique({
    where: { tenantId: session.user.tenantId }
  })
  
  if (!integration) {
    return NextResponse.json({ error: 'LinkedIn not connected' }, { status: 400 })
  }
  
  // 2. Fetch user's posts from LinkedIn API
  const linkedInPosts = await fetchLinkedInPosts(integration.accessToken, {
    limit: 50 // ultimele 50 posturi
  })
  
  // 3. Analizează stilul și pattern-urile
  const styleAnalysis = analyzeWritingStyle(linkedInPosts)
  
  // 4. Salvează ca learning data
  for (const post of linkedInPosts) {
    await prisma.aILearningData.create({
      data: {
        tenantId: session.user.tenantId,
        interactionType: 'historical_post',
        originalContent: post.content,
        patternDetected: `Past style: ${post.engagement.likes} likes, ${post.engagement.comments} comments`,
        improvementScore: calculateEngagementScore(post.engagement)
      }
    })
  }
  
  // 5. Update AI config cu styling insights
  await prisma.aIConfig.update({
    where: { tenantId: session.user.tenantId },
    data: {
      brandVoice: generateBrandVoice(styleAnalysis),
      tonePreference: styleAnalysis.dominantTone,
      postLength: styleAnalysis.averageLength
    }
  })
  
  return NextResponse.json({
    imported: linkedInPosts.length,
    insights: styleAnalysis
  })
}

// Helper: Analyze writing style
function analyzeWritingStyle(posts) {
  return {
    averageLength: calculateAverage(posts.map(p => p.content.length)),
    dominantTone: detectTone(posts.map(p => p.content)),
    hashtagUsage: analyzeHashtags(posts),
    emojiUsage: analyzeEmojis(posts),
    topTopics: extractTopics(posts),
    engagementPatterns: analyzeEngagement(posts),
    postingTimes: analyzeTiming(posts)
  }
}
```

#### B) UI pentru import

```typescript
// În /dashboard/settings sau /dashboard/ai-insights
<Card>
  <CardHeader>
    <CardTitle>Import LinkedIn History</CardTitle>
    <CardDescription>
      Let AI learn from your past successful posts
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Button onClick={handleImportLinkedIn}>
      <Download className="mr-2 h-4 w-4" />
      Import Last 50 Posts
    </Button>
    
    {importStatus && (
      <div className="mt-4">
        <p>Imported: {importStatus.imported} posts</p>
        <p>Detected tone: {importStatus.insights.dominantTone}</p>
        <p>Average length: {importStatus.insights.averageLength} chars</p>
      </div>
    )}
  </CardContent>
</Card>
```

### 📋 Pași de implementare:
1. ✅ Creează `/api/integrations/linkedin/import-posts`
2. ✅ Implementează LinkedIn API pentru fetch posts
3. ✅ Creează funcții de analiză: tone, style, engagement
4. ✅ Adaugă UI în Settings
5. ✅ Auto-import periodic (optional, cron job)

---

## 🔴 PROBLEMA 6: Integrare OneDrive/Google Drive pentru Imagini

### 📍 Status Actual
- Upload imagini funcționează doar manual prin Cloudinary
- Nu există integrare cu cloud storage services
- AI nu poate alege automat imagini relevante

### ✅ Soluție Propusă

#### A) Adaugă integrări cloud storage

```typescript
// Prisma schema - adaugă nou model
model CloudStorageIntegration {
  id            String   @id @default(cuid())
  tenantId      String
  provider      String   // 'onedrive', 'googledrive', 'dropbox'
  accessToken   String
  refreshToken  String?
  folderPath    String   // folder cu imagini pentru social media
  syncEnabled   Boolean  @default(true)
  lastSync      DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  tenant Tenant @relation(fields: [tenantId], references: [id])
  
  @@unique([tenantId, provider])
  @@map("cloud_storage_integrations")
}

model MediaAsset {
  id          String   @id @default(cuid())
  tenantId    String
  fileName    String
  fileUrl     String   // URL Cloudinary sau cloud storage
  source      String   // 'upload', 'onedrive', 'googledrive'
  tags        String[] // AI-generated tags
  description String?  // AI-generated description
  usedCount   Int      @default(0)
  lastUsed    DateTime?
  createdAt   DateTime @default(now())
  
  tenant Tenant @relation(fields: [tenantId], references: [id])
  
  @@map("media_assets")
}
```

#### B) OAuth integration pentru OneDrive

```typescript
// /api/integrations/onedrive/auth/route.ts
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  // Redirect to Microsoft OAuth
  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
    `client_id=${process.env.MICROSOFT_CLIENT_ID}` +
    `&response_type=code` +
    `&redirect_uri=${process.env.MICROSOFT_REDIRECT_URI}` +
    `&scope=Files.Read.All offline_access` +
    `&state=${session.user.tenantId}`
  
  return NextResponse.redirect(authUrl)
}

// /api/integrations/onedrive/callback/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const tenantId = searchParams.get('state')
  
  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(code)
  
  // Save integration
  await prisma.cloudStorageIntegration.create({
    data: {
      tenantId,
      provider: 'onedrive',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      folderPath: '/SocialMediaImages' // default folder
    }
  })
  
  return NextResponse.redirect('/dashboard/settings?tab=integrations')
}
```

#### C) Sync imagini din cloud storage

```typescript
// /api/integrations/cloud-storage/sync/route.ts
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const { provider } = await request.json()
  
  const integration = await prisma.cloudStorageIntegration.findUnique({
    where: {
      tenantId_provider: {
        tenantId: session.user.tenantId,
        provider
      }
    }
  })
  
  if (!integration) {
    return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
  }
  
  // Fetch images from OneDrive/Google Drive
  const images = await fetchImagesFromCloud(integration)
  
  // Process each image
  const processed = []
  for (const image of images) {
    // 1. Upload to Cloudinary (for optimization)
    const cloudinaryUrl = await uploadToCloudinary(image.downloadUrl)
    
    // 2. AI: Generate tags and description
    const aiAnalysis = await analyzeImageWithAI(cloudinaryUrl)
    
    // 3. Save as media asset
    const asset = await prisma.mediaAsset.create({
      data: {
        tenantId: session.user.tenantId,
        fileName: image.name,
        fileUrl: cloudinaryUrl,
        source: provider,
        tags: aiAnalysis.tags,
        description: aiAnalysis.description
      }
    })
    
    processed.push(asset)
  }
  
  // Update last sync
  await prisma.cloudStorageIntegration.update({
    where: { id: integration.id },
    data: { lastSync: new Date() }
  })
  
  return NextResponse.json({
    synced: processed.length,
    assets: processed
  })
}

// Helper: Analyze image with AI (GPT-4 Vision)
async function analyzeImageWithAI(imageUrl: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze this image and provide: 1) 5-10 relevant tags, 2) A brief description for social media. Return as JSON: {tags: [], description: ''}"
          },
          {
            type: "image_url",
            image_url: { url: imageUrl }
          }
        ]
      }
    ]
  })
  
  return JSON.parse(response.choices[0].message.content)
}
```

#### D) AI alege imagini relevante la generare

```typescript
// În /api/content/generate/route.ts sau /api/autopilot/generate
// După ce AI generează textul postării:

const postContent = response.choices[0].message.content

// 1. Extrage keywords din post
const keywords = extractKeywords(postContent)

// 2. Caută imagini relevante din media assets
const relevantImages = await prisma.mediaAsset.findMany({
  where: {
    tenantId: session.user.tenantId,
    OR: keywords.map(keyword => ({
      tags: { has: keyword }
    }))
  },
  orderBy: [
    { usedCount: 'asc' }, // preferă imagini mai puțin folosite
    { createdAt: 'desc' }
  ],
  take: 3
})

// 3. Dacă nu găsește imagini, poate genera cu DALL-E
if (relevantImages.length === 0) {
  const generatedImage = await openai.images.generate({
    model: "dall-e-3",
    prompt: `Create a professional image for this social media post: ${postContent.substring(0, 200)}`,
    size: "1024x1024",
    quality: "standard"
  })
  
  // Upload to Cloudinary
  const cloudinaryUrl = await uploadToCloudinary(generatedImage.data[0].url)
  
  // Save as asset
  await prisma.mediaAsset.create({
    data: {
      tenantId: session.user.tenantId,
      fileName: `ai-generated-${Date.now()}.png`,
      fileUrl: cloudinaryUrl,
      source: 'ai-generated',
      tags: keywords
    }
  })
  
  relevantImages.push({ fileUrl: cloudinaryUrl })
}

// 4. Creează post cu imagini
const post = await prisma.post.create({
  data: {
    content: postContent,
    mediaUrls: relevantImages.map(img => img.fileUrl).slice(0, 1), // primă imagine
    // ... rest of post data
  }
})
```

### 📋 Pași de implementare:
1. ✅ Adaugă models în Prisma: `CloudStorageIntegration`, `MediaAsset`
2. ✅ Implementează OAuth pentru OneDrive + Google Drive
3. ✅ Creează `/api/integrations/cloud-storage/sync`
4. ✅ Integrează GPT-4 Vision pentru image analysis
5. ✅ Modifică `/api/content/generate` pentru auto-select images
6. ✅ Adaugă UI în Settings pentru cloud integrations
7. ✅ Creează `/dashboard/media` pentru media library management
8. ✅ Opțional: DALL-E integration pentru generate images

---

## 📊 Rezumat Prioritizare

### 🔥 HIGH PRIORITY (Implementare imediată)
1. **Buton Publish din Draft** - Impact mare, implementare simplă
2. **Website Scraping pentru AI Training** - Esențial pentru brand voice
3. **AI Learning din Modificări** - Core feature pentru îmbunătățire continuă
4. **Cloud Storage Integration** - Nevoie critică pentru workflow

### 🟡 MEDIUM PRIORITY (Săptămâna viitoare)
5. **RSS/News Feeds** - Important pentru content inspiration
6. **LinkedIn Feed Analysis** - Nice-to-have pentru learning

### 📦 Dependencies necesare

```bash
npm install rss-parser      # Pentru RSS feeds
npm install cheerio         # Pentru web scraping
npm install @microsoft/microsoft-graph-client  # Pentru OneDrive
npm install googleapis      # Pentru Google Drive
```

### 🗂️ Modificări Schema Database

```prisma
// Adaugă în schema.prisma:

model CloudStorageIntegration {
  // ... (vezi mai sus)
}

model MediaAsset {
  // ... (vezi mai sus)
}

model BrandTrainingData {
  id          String   @id @default(cuid())
  tenantId    String
  sourceUrl   String
  content     String
  category    String   // 'about', 'products', 'values', 'tone'
  lastUpdated DateTime @updatedAt
  createdAt   DateTime @default(now())
  
  tenant Tenant @relation(fields: [tenantId], references: [id])
  
  @@map("brand_training_data")
}

// Update Tenant model
model Tenant {
  // ... existing fields
  cloudStorageIntegrations CloudStorageIntegration[]
  mediaAssets              MediaAsset[]
  brandTrainingData        BrandTrainingData[]
}
```

---

## 🚀 Next Steps

1. **Review și Aprobare** - Confirmă ce features vrei implementate
2. **Prioritizare** - Stabilește ordinea de implementare
3. **Implementare Fazată** - Lucrez la features în ordinea priorității
4. **Testing** - Pentru fiecare feature implementat
5. **Documentation** - Update README cu noile features

## 📞 Întrebări pentru Clarificare

1. **OneDrive vs Google Drive**: Care e prioritatea? Implementez ambele sau doar unul?
2. **DALL-E Integration**: Vrei generare automată de imagini sau doar selecție din biblioteca existentă?
3. **RSS Feeds**: Ai surse specifice de știri pe care vrei să le monitorizeze?
4. **LinkedIn Analysis**: Vrei import one-time sau sync periodic?

---

**Gata să încep implementarea! 🎯**

Care feature vrei să implementez primul?
