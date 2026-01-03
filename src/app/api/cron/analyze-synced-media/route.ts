export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

/**
 * CRON Job: Analyze Synced Media
 * Runs every 10 minutes
 * Uses GPT-4o Vision to analyze images and extract metadata
 */
export async function GET(request: NextRequest) {
  try {
    // Verify CRON secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 CRON: Starting media analysis...')

    // Find pending media to analyze (limit to 10 per run to avoid timeouts)
    const pendingMedia = await prisma.syncedMedia.findMany({
      where: {
        processingStatus: 'PENDING',
        mediaType: 'image', // Only images for now (video support later)
      },
      include: {
        tenant: true,
        integration: true,
      },
      take: 10,
      orderBy: { syncedAt: 'asc' }, // Oldest first
    })

    console.log(`📸 Found ${pendingMedia.length} media to analyze`)

    if (pendingMedia.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No media to analyze',
        analyzed: 0,
      })
    }

    const results = {
      analyzed: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    for (const media of pendingMedia) {
      try {
        console.log(`\n🔍 Analyzing: ${media.originalFileName}`)

        // Update status to ANALYZING
        await prisma.syncedMedia.update({
          where: { id: media.id },
          data: { processingStatus: 'ANALYZING' },
        })

        // Analyze with GPT-4o Vision
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this image for social media content creation. Extract:
                  
1. **Description**: Detailed description of what's in the image (2-3 sentences)
2. **Topics**: Main themes/topics (3-5 keywords like "team", "office", "product", "meeting", etc.)
3. **Mood**: Overall mood/emotion (e.g., "professional", "casual", "exciting", "inspirational", "celebratory")
4. **Objects**: Key objects/elements detected (e.g., "people", "laptop", "office space", "product", "logo")
5. **Context**: The context/setting (e.g., "team meeting", "product demo", "office environment", "event", "presentation")

Return ONLY a valid JSON object with these exact keys: description, topics, mood, objects, context

Example:
{
  "description": "A diverse team of professionals collaborating in a modern office space with natural lighting",
  "topics": ["teamwork", "collaboration", "office", "workplace", "technology"],
  "mood": "professional",
  "objects": ["people", "laptops", "desks", "windows", "office furniture"],
  "context": "team meeting"
}`,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: media.localUrl!,
                    detail: 'high',
                  },
                },
              ],
            },
          ],
          max_tokens: 500,
          temperature: 0.3, // Lower temperature for more consistent results
        })

        const analysisText = response.choices[0]?.message?.content || '{}'
        console.log('📝 Raw GPT-4o response:', analysisText)

        // Parse JSON response
        let analysis: any
        try {
          // Remove markdown code blocks if present
          const cleanedText = analysisText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim()
          
          analysis = JSON.parse(cleanedText)
        } catch (parseError) {
          console.error('Failed to parse JSON, attempting extraction...')
          // Fallback: try to extract JSON from text
          const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[0])
          } else {
            throw new Error('Failed to parse analysis result')
          }
        }

        // Validate required fields
        if (!analysis.description || !analysis.topics || !analysis.mood) {
          throw new Error('Incomplete analysis result')
        }

        // Ensure topics and objects are arrays
        if (typeof analysis.topics === 'string') {
          analysis.topics = analysis.topics.split(',').map((t: string) => t.trim())
        }
        if (typeof analysis.objects === 'string') {
          analysis.objects = analysis.objects.split(',').map((o: string) => o.trim())
        }

        // Update media with analysis results
        await prisma.syncedMedia.update({
          where: { id: media.id },
          data: {
            aiAnalyzed: true,
            aiAnalysisResult: analysis,
            aiDescription: analysis.description,
            aiSuggestedTopics: Array.isArray(analysis.topics) ? analysis.topics : [],
            aiDetectedObjects: Array.isArray(analysis.objects) ? analysis.objects : [],
            aiMood: analysis.mood,
            aiContext: analysis.context,
            processingStatus: 'ANALYZED',
            lastProcessedAt: new Date(),
          },
        })

        console.log(`✅ Analysis complete for: ${media.originalFileName}`)
        console.log(`   Topics: ${analysis.topics?.join(', ')}`)
        console.log(`   Mood: ${analysis.mood}`)
        console.log(`   Context: ${analysis.context}`)

        results.analyzed++

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error: any) {
        console.error(`❌ Failed to analyze ${media.originalFileName}:`, error.message)
        
        // Update status to FAILED
        await prisma.syncedMedia.update({
          where: { id: media.id },
          data: {
            processingStatus: 'FAILED',
            errorMessage: error.message,
            lastProcessedAt: new Date(),
          },
        })

        results.failed++
        results.errors.push(`${media.originalFileName}: ${error.message}`)
      }
    }

    console.log('\n✨ CRON: Media analysis complete')
    console.log(`📊 Results: ${results.analyzed} analyzed, ${results.failed} failed`)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (error: any) {
    console.error('❌ CRON: Media analysis failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to analyze media',
      },
      { status: 500 }
    )
  }
}

// Allow manual POST trigger
export async function POST(request: NextRequest) {
  return GET(request)
}
