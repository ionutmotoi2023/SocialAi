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
  generationTime: number
  suggestions?: string[]
}

export async function generateContent(
  params: GenerateContentParams
): Promise<GeneratedContent> {
  const startTime = Date.now()

  try {
    // Build system prompt
    const systemPrompt = buildSystemPrompt(params)

    // Generate content with GPT-4
    const openai = getOpenAIClient()
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
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

    const generatedText = response.choices[0]?.message?.content || ''
    const generationTime = Date.now() - startTime

    // Extract hashtags from generated content
    const hashtags = extractHashtags(generatedText)

    // Calculate confidence score based on various factors
    const confidence = calculateConfidence(response, generatedText)

    return {
      text: generatedText,
      hashtags,
      confidence,
      model: 'gpt-4-turbo',
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
    tone = 'professional',
    postLength = 'medium',
    includeHashtags = true,
    includeCTA = true,
    includeEmojis = true,
    platform = 'linkedin',
  } = params

  let prompt = `You are an expert social media content creator specializing in ${platform} posts.`

  if (brandVoice) {
    prompt += `\n\nBrand Voice: ${brandVoice}`
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
      model: 'gpt-4-vision-preview',
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
