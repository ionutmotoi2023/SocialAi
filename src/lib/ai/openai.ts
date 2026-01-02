import OpenAI from 'openai'

// Lazy initialization of OpenAI client
let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey === 'sk-dummy-key-for-build-only' || apiKey === 'sk-dummy-key-for-build-only-replace-with-real') {
      // În loc să aruncăm eroare, returnăm un client mock pentru build
      console.warn('OPENAI_API_KEY nu este configurat - folosim client mock pentru build')
      openaiClient = {
        chat: {
          completions: {
            create: async () => ({
              choices: [{
                message: {
                  content: 'Conținut demo - cheia OpenAI nu este configurată. Vă rugăm să configurați OPENAI_API_KEY în variabilele de mediu.'
                }
              }],
              finish_reason: 'stop'
            })
          }
        }
      } as any
    } else {
      openaiClient = new OpenAI({ apiKey })
    }
  }
  return openaiClient
}

export interface GenerateContentParams {
  prompt: string
  mediaUrls?: string[]
  brandVoice?: string
  brandContext?: string // NEW: Brand training data context
  tone?: 'professional' | 'casual' | 'enthusiastic' | 'technical'
  postLength?: 'short' | 'medium' | 'long'
  includeHashtags?: boolean
  includeCTA?: boolean
  includeEmojis?: boolean
  platform?: 'linkedin' | 'twitter' | 'facebook'
}

export interface GeneratedContent {
  text: string
  hashtags: string[]
  confidence: number
  model: string
  generationTime: number // in seconds
  suggestions?: string[]
}

export async function generateContent(
  params: GenerateContentParams
): Promise<GeneratedContent> {
  const startTime = Date.now()

  try {
    // Build system prompt
    const systemPrompt = buildSystemPrompt(params)

    // Check if there are media URLs (images/videos)
    const hasMedia = params.mediaUrls && params.mediaUrls.length > 0

    // Generate content with GPT-4o (multimodal - handles text, vision, audio)
    const openai = getOpenAIClient()
    
    let response
    if (hasMedia) {
      // Build message content with images for multimodal input
      const userContent: any[] = [
        {
          type: 'text',
          text: `${systemPrompt}\n\nUser request: ${params.prompt}`,
        }
      ]

      // Add all media URLs as image_url entries (convert relative to absolute)
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      params.mediaUrls!.forEach(url => {
        // Convert relative URLs to absolute
        const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`
        
        userContent.push({
          type: 'image_url',
          image_url: {
            url: fullUrl,
            detail: 'high' // Use 'high' for better image analysis
          },
        })
      })

      response = await openai.chat.completions.create({
        model: 'gpt-4o', // gpt-4o is multimodal (text + vision + audio)
        messages: [
          {
            role: 'user',
            content: userContent,
          },
        ],
        temperature: 0.7,
        max_tokens: getMaxTokens(params.postLength),
      })
    } else {
      // No media - text only, but still use gpt-4o (it handles text too!)
      response = await openai.chat.completions.create({
        model: 'gpt-4o', // Same model for everything!
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: params.prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: getMaxTokens(params.postLength),
      })
    }

    const generatedText = response.choices[0]?.message?.content || ''
    const generationTimeMs = Date.now() - startTime
    const generationTime = Math.round(generationTimeMs / 1000) // Convert to seconds

    // Extract hashtags from generated content
    const hashtags = extractHashtags(generatedText)

    // Calculate confidence score based on various factors
    const confidence = calculateConfidence(response, generatedText)

    return {
      text: generatedText,
      hashtags,
      confidence,
      model: 'gpt-4o', // Always gpt-4o (multimodal model)
      generationTime,
      suggestions: generateSuggestions(generatedText),
    }
  } catch (error: any) {
    console.error('OpenAI generation error:', error)
    throw new Error(`Failed to generate content: ${error.message}`)
  }
}

function buildSystemPrompt(params: GenerateContentParams): string {
  const {
    brandVoice,
    brandContext, // NEW
    tone = 'professional',
    postLength = 'medium',
    includeHashtags = true,
    includeCTA = true,
    includeEmojis = true,
    platform = 'linkedin',
  } = params

  let prompt = `You are an expert social media content creator specializing in ${platform} posts.`

  // Add brand context if available
  if (brandContext) {
    prompt += `\n\n${brandContext}`
    prompt += `\n\nIMPORTANT: Use the brand information above to create content that aligns with the company's voice, values, and messaging. Reference specific products, services, or values when relevant.`
  }

  if (brandVoice) {
    prompt += `\n\nBrand Voice Guidelines: ${brandVoice}`
  }

  prompt += `\n\nTone: ${tone}`
  prompt += `\nPost Length: ${postLength} (${getLengthGuidance(postLength)})`

  if (platform === 'linkedin') {
    prompt += `\n\nLinkedIn Best Practices:
- Professional yet engaging tone
- Focus on insights and value
- Use storytelling when appropriate
- Include line breaks for readability`
  }

  if (includeHashtags) {
    prompt += `\n\nInclude 3-5 relevant hashtags at the end.`
  }

  if (includeCTA) {
    prompt += `\nInclude a subtle call-to-action.`
  }

  if (includeEmojis) {
    prompt += `\nUse 1-3 relevant emojis to enhance engagement (don't overdo it).`
  }

  prompt += `\n\nImportant: Create engaging, authentic content that resonates with the target audience. Avoid generic or corporate jargon.`

  return prompt
}

function getLengthGuidance(length: string): string {
  switch (length) {
    case 'short':
      return '1-2 paragraphs, ~100-150 words'
    case 'medium':
      return '2-3 paragraphs, ~150-250 words'
    case 'long':
      return '3-4 paragraphs, ~250-400 words'
    default:
      return '2-3 paragraphs'
  }
}

function getMaxTokens(length?: string): number {
  switch (length) {
    case 'short':
      return 200
    case 'medium':
      return 400
    case 'long':
      return 600
    default:
      return 400
  }
}

function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w]+/g
  const matches = text.match(hashtagRegex)
  return matches ? matches.map((tag) => tag.substring(1)) : []
}

function calculateConfidence(
  response: OpenAI.Chat.Completions.ChatCompletion,
  generatedText: string
): number {
  // Base confidence from finish_reason
  let confidence = 0.7

  if (response.choices[0]?.finish_reason === 'stop') {
    confidence += 0.2
  }

  // Adjust based on content quality indicators
  if (generatedText.length > 100 && generatedText.length < 500) {
    confidence += 0.05
  }

  // Check for hashtags
  if (extractHashtags(generatedText).length >= 3) {
    confidence += 0.03
  }

  // Check for emojis
  const emojiRegex = /[\u{1F600}-\u{1F64F}]/u
  if (emojiRegex.test(generatedText)) {
    confidence += 0.02
  }

  return Math.min(confidence, 1.0)
}

function generateSuggestions(text: string): string[] {
  const suggestions: string[] = []

  // Add contextual suggestions
  if (text.length < 100) {
    suggestions.push('Consider adding more detail to increase engagement')
  }

  if (!text.includes('?') && !text.includes('!')) {
    suggestions.push('Try adding a question or exclamation to boost engagement')
  }

  const hashtags = extractHashtags(text)
  if (hashtags.length < 3) {
    suggestions.push('Add more relevant hashtags to increase discoverability')
  }

  if (hashtags.length > 7) {
    suggestions.push('Consider reducing hashtags - LinkedIn performs best with 3-5 hashtags')
  }

  return suggestions
}

// Analyze image content using GPT-4 Vision
export async function analyzeImage(imageUrl: string): Promise<string> {
  try {
    const openai = getOpenAIClient()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Using gpt-4o which has better vision capabilities
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this image and describe what you see. Focus on key elements that would be relevant for creating social media content.',
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high', // Request high detail analysis
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    })

    return response.choices[0]?.message?.content || 'Unable to analyze image'
  } catch (error: any) {
    console.error('Image analysis error:', error)
    return 'Image analysis unavailable'
  }
}

// DALL-E 3 Image Generation
export interface GenerateImageParams {
  prompt: string
  size?: '1024x1024' | '1024x1792' | '1792x1024'
  quality?: 'standard' | 'hd'
  style?: 'vivid' | 'natural'
}

export interface GeneratedImage {
  url: string
  revisedPrompt: string
  size: string
  quality: string
}

/**
 * Generate image using DALL-E 3
 */
export async function generateImage(
  params: GenerateImageParams
): Promise<GeneratedImage> {
  try {
    const openai = getOpenAIClient()

    const {
      prompt,
      size = '1024x1024',
      quality = 'standard',
      style = 'natural',
    } = params

    console.log('Generating image with DALL-E 3:', { prompt, size, quality, style })

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size,
      quality,
      style,
    })

    const imageData = response.data[0]

    if (!imageData?.url) {
      throw new Error('No image URL returned from DALL-E 3')
    }

    return {
      url: imageData.url,
      revisedPrompt: imageData.revised_prompt || prompt,
      size,
      quality,
    }
  } catch (error: any) {
    console.error('DALL-E 3 generation error:', error)
    throw new Error(`Failed to generate image: ${error.message}`)
  }
}

/**
 * Generate image based on social media post content
 */
export async function generateImageForPost(
  postContent: string,
  options: {
    platform?: 'linkedin' | 'twitter' | 'facebook'
    style?: 'professional' | 'creative' | 'minimalist' | 'bold'
  } = {}
): Promise<GeneratedImage> {
  const { platform = 'linkedin', style = 'professional' } = options

  // Build optimized DALL-E prompt
  let imagePrompt = ''

  // Style guidelines
  const styleGuides = {
    professional: 'Clean, professional, business-appropriate visual. High quality, corporate aesthetic.',
    creative: 'Creative, artistic, eye-catching design. Bold colors and unique composition.',
    minimalist: 'Minimalist, simple, elegant design. Clean lines, subtle colors, modern aesthetic.',
    bold: 'Bold, vibrant, attention-grabbing visual. Strong colors, dynamic composition.',
  }

  // Platform guidelines
  const platformGuides = {
    linkedin: 'Professional business context, suitable for LinkedIn audience.',
    twitter: 'Engaging, shareable visual for Twitter/X.',
    facebook: 'Friendly, relatable visual for Facebook audience.',
  }

  // Extract key themes from post content (simple keyword extraction)
  const contentLower = postContent.toLowerCase()
  const keywords: string[] = []

  // Common business/tech keywords
  const keywordMap: { [key: string]: string } = {
    'ai': 'artificial intelligence technology',
    'technology': 'modern technology',
    'business': 'business professional',
    'marketing': 'marketing strategy',
    'data': 'data analytics',
    'team': 'business team collaboration',
    'success': 'success achievement',
    'growth': 'business growth',
    'innovation': 'innovation technology',
    'leadership': 'leadership professional',
  }

  Object.entries(keywordMap).forEach(([keyword, phrase]) => {
    if (contentLower.includes(keyword)) {
      keywords.push(phrase)
    }
  })

  // Build final prompt
  if (keywords.length > 0) {
    imagePrompt = `${styleGuides[style]} ${platformGuides[platform]} Theme: ${keywords.slice(0, 3).join(', ')}. `
  } else {
    // Fallback: generic business image
    imagePrompt = `${styleGuides[style]} ${platformGuides[platform]} Generic professional business visual. `
  }

  imagePrompt += 'No text or words in the image. Photo-realistic quality.'

  // Determine optimal size for platform
  let size: '1024x1024' | '1024x1792' | '1792x1024' = '1024x1024'
  if (platform === 'linkedin' || platform === 'facebook') {
    size = '1024x1024' // Square for LinkedIn/Facebook
  }

  return generateImage({
    prompt: imagePrompt,
    size,
    quality: 'standard',
    style: style === 'professional' || style === 'minimalist' ? 'natural' : 'vivid',
  })
}
