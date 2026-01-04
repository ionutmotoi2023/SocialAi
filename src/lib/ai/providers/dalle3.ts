/**
 * DALL-E 3 Image Generation Provider (OpenAI)
 */

import OpenAI from 'openai'
import { ImageProvider, ImageGenerationParams, GeneratedImageResult } from './types'

export class DallE3Provider implements ImageProvider {
  name = 'DALL-E 3 (OpenAI)'
  id = 'dalle3'
  private client: OpenAI | null = null

  private getClient(): OpenAI {
    if (!this.client) {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey || apiKey.startsWith('sk-dummy')) {
        throw new Error('OPENAI_API_KEY not configured')
      }
      this.client = new OpenAI({ apiKey })
    }
    return this.client
  }

  async isAvailable(): Promise<boolean> {
    try {
      const apiKey = process.env.OPENAI_API_KEY
      return !!(apiKey && !apiKey.startsWith('sk-dummy'))
    } catch {
      return false
    }
  }

  async generate(params: ImageGenerationParams): Promise<GeneratedImageResult> {
    const startTime = Date.now()
    
    try {
      const openai = this.getClient()

      // Convert aspectRatio to DALL-E size format
      let size: '1024x1024' | '1024x1792' | '1792x1024' = '1024x1024'
      if (params.aspectRatio === '9:16' || params.size === '1024x1792') {
        size = '1024x1792'
      } else if (params.aspectRatio === '16:9' || params.size === '1792x1024') {
        size = '1792x1024'
      }

      console.log('🎨 DALL-E 3: Generating image...', {
        prompt: params.prompt.substring(0, 100) + '...',
        size,
        quality: params.quality || 'standard',
        style: params.style || 'vivid',
      })

      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: params.prompt,
        n: 1,
        size,
        quality: params.quality || 'standard',
        style: params.style || 'vivid',
      })

      const imageData = response.data[0]
      if (!imageData?.url) {
        throw new Error('No image URL returned from DALL-E 3')
      }

      const generationTime = Date.now() - startTime

      // Calculate cost based on quality
      const cost = params.quality === 'hd' ? 0.080 : 0.040

      console.log('✅ DALL-E 3: Image generated successfully', {
        url: imageData.url.substring(0, 50) + '...',
        generationTime: `${generationTime}ms`,
        cost: `$${cost}`,
      })

      return {
        url: imageData.url,
        revisedPrompt: imageData.revised_prompt,
        width: size === '1024x1792' ? 1024 : size === '1792x1024' ? 1792 : 1024,
        height: size === '1024x1792' ? 1792 : size === '1792x1024' ? 1024 : 1024,
        format: 'png',
        provider: this.name,
        model: 'dall-e-3',
        generationTime,
        cost,
      }
    } catch (error: any) {
      console.error('❌ DALL-E 3 generation error:', error)
      throw new Error(`DALL-E 3 generation failed: ${error.message}`)
    }
  }
}
