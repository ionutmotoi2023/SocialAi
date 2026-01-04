/**
 * FLUX.1 Schnell Image Generation Provider (via Replicate)
 * Ultra-fast, low-cost image generation
 */

import Replicate from 'replicate'
import { ImageProvider, ImageGenerationParams, GeneratedImageResult } from './types'

export class FluxSchnellProvider implements ImageProvider {
  name = 'FLUX.1 Schnell'
  id = 'flux-schnell'
  private client: Replicate | null = null

  private getClient(): Replicate {
    if (!this.client) {
      const apiKey = process.env.REPLICATE_API_TOKEN
      if (!apiKey) {
        throw new Error('REPLICATE_API_TOKEN not configured')
      }
      this.client = new Replicate({ auth: apiKey })
    }
    return this.client
  }

  async isAvailable(): Promise<boolean> {
    try {
      const apiKey = process.env.REPLICATE_API_TOKEN
      return !!apiKey
    } catch {
      return false
    }
  }

  async generate(params: ImageGenerationParams): Promise<GeneratedImageResult> {
    const startTime = Date.now()
    
    try {
      const replicate = this.getClient()

      // Convert size to aspect ratio format
      let aspectRatio = params.aspectRatio || '1:1'
      if (params.size === '1024x1792') aspectRatio = '9:16'
      else if (params.size === '1792x1024') aspectRatio = '16:9'

      console.log('🎨 FLUX Schnell: Generating image (ultra-fast mode)...', {
        prompt: params.prompt.substring(0, 100) + '...',
        aspectRatio,
      })

      const output = await replicate.run(
        "black-forest-labs/flux-schnell" as any,
        {
          input: {
            prompt: params.prompt,
            aspect_ratio: aspectRatio,
            output_format: 'jpg',
            output_quality: 90,
            num_inference_steps: params.numInferenceSteps || 4, // Faster with fewer steps
          }
        }
      ) as any

      const generationTime = Date.now() - startTime

      // FLUX Schnell cost: $0.003 per image (10x cheaper than DALL-E 3 HD!)
      const cost = 0.003

      // Output is a URL string
      const imageUrl = typeof output === 'string' ? output : (output as any).url || (Array.isArray(output) ? output[0] : '')

      if (!imageUrl) {
        throw new Error('No image URL returned from FLUX Schnell')
      }

      console.log('✅ FLUX Schnell: Image generated successfully', {
        url: imageUrl.substring(0, 50) + '...',
        generationTime: `${generationTime}ms`,
        cost: `$${cost}`,
      })

      // Determine dimensions based on aspect ratio
      let width = 1024
      let height = 1024
      if (aspectRatio === '16:9') {
        width = 1344
        height = 768
      } else if (aspectRatio === '9:16') {
        width = 768
        height = 1344
      } else if (aspectRatio === '4:3') {
        width = 1152
        height = 896
      } else if (aspectRatio === '3:4') {
        width = 896
        height = 1152
      }

      return {
        url: imageUrl,
        revisedPrompt: params.prompt,
        width,
        height,
        format: 'jpg',
        provider: this.name,
        model: 'flux-schnell',
        generationTime,
        cost,
      }
    } catch (error: any) {
      console.error('❌ FLUX Schnell generation error:', error)
      throw new Error(`FLUX Schnell generation failed: ${error.message}`)
    }
  }
}
