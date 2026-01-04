import { generateImageForPost, generateImage } from '@/lib/ai/openai'
import { downloadImage, applyWatermark, ProcessedImage } from '@/lib/image/processor'
import { uploadToCloudinary, UploadResult } from '@/lib/storage/cloudinary'

export interface ImageGenerationResult {
  imageUrl: string // Final Cloudinary URL with watermark
  optimizedUrl?: string // Optimized URL for GPT-4 Vision
  dallePrompt: string // Original DALL-E prompt
  revisedPrompt: string // DALL-E's revised prompt
  publicId: string // Cloudinary public ID
  width: number
  height: number
  size: number
}

/**
 * Complete workflow: Generate image with DALL-E 3 → Apply watermark → Upload to Cloudinary
 */
export async function generateAndProcessImage(
  postContent: string,
  tenantId: string,
  options: {
    platform?: 'linkedin' | 'twitter' | 'facebook'
    style?: string // ✅ CHANGED: Accept any custom style ID
    provider?: string // ✅ NEW: Image provider selection
    brandContext?: string
    rssInspiration?: {
      title: string
      content: string
    }
    tenantInfo?: {
      name: string
      industry?: string
      description?: string
    }
  } = {}
): Promise<ImageGenerationResult> {
  try {
    console.log('🎨 Starting AI image generation workflow with enhanced context...')

    // Step 1: Generate image with selected AI provider (DALL-E 3, FLUX, etc.)
    console.log('Step 1: Generating image with AI provider...')
    const dalleResult = await generateImageForPost(postContent, {
      tenantId, // ✅ Pass tenantId for custom styles
      provider: options.provider, // ✅ Pass provider selection
      ...options,
    })
    console.log('✅ AI generated image:', dalleResult.url)

    // Step 2: Download the generated image
    console.log('Step 2: Downloading generated image...')
    const imageBuffer = await downloadImage(dalleResult.url)
    console.log('✅ Image downloaded, size:', imageBuffer.length, 'bytes')

    // Step 3: Apply watermark with brand logo
    console.log('Step 3: Applying watermark with brand logo...')
    const watermarked = await applyWatermark(imageBuffer, tenantId, {
      position: 'bottom-right',
      opacity: 0.7,
      scale: 0.15,
      margin: 20,
    })
    console.log('✅ Watermark applied, final size:', watermarked.size, 'bytes')

    // Step 4: Upload to Cloudinary
    console.log('Step 4: Uploading to Cloudinary...')
    const uploadResult = await uploadToCloudinary(
      watermarked.buffer,
      'dalle-generated-image.jpg',
      'social-ai/generated'
    )
    console.log('✅ Uploaded to Cloudinary:', uploadResult.secureUrl)

    return {
      imageUrl: uploadResult.secureUrl,
      optimizedUrl: uploadResult.optimizedUrl,
      dallePrompt: dalleResult.revisedPrompt,
      revisedPrompt: dalleResult.revisedPrompt,
      publicId: uploadResult.publicId,
      width: uploadResult.width,
      height: uploadResult.height,
      size: watermarked.size,
    }
  } catch (error: any) {
    console.error('❌ Image generation workflow failed:', error)
    throw new Error(`Failed to generate and process image: ${error.message}`)
  }
}

/**
 * Apply watermark to existing image URL and upload to Cloudinary
 */
export async function processExistingImage(
  imageUrl: string,
  tenantId: string
): Promise<ImageGenerationResult> {
  try {
    console.log('🖼️  Processing existing image:', imageUrl)

    // Step 1: Download the image
    const imageBuffer = await downloadImage(imageUrl)

    // Step 2: Apply watermark
    const watermarked = await applyWatermark(imageBuffer, tenantId, {
      position: 'bottom-right',
      opacity: 0.7,
      scale: 0.15,
      margin: 20,
    })

    // Step 3: Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(
      watermarked.buffer,
      'processed-image.jpg',
      'social-ai/processed'
    )

    return {
      imageUrl: uploadResult.secureUrl,
      optimizedUrl: uploadResult.optimizedUrl,
      dallePrompt: 'Existing image (not AI generated)',
      revisedPrompt: 'Existing image (not AI generated)',
      publicId: uploadResult.publicId,
      width: uploadResult.width,
      height: uploadResult.height,
      size: watermarked.size,
    }
  } catch (error: any) {
    console.error('❌ Image processing failed:', error)
    throw new Error(`Failed to process existing image: ${error.message}`)
  }
}

/**
 * Generate custom image with specific prompt (not based on post content)
 */
export async function generateCustomImage(
  prompt: string,
  tenantId: string,
  options: {
    size?: '1024x1024' | '1024x1792' | '1792x1024'
    quality?: 'standard' | 'hd'
    style?: 'vivid' | 'natural'
  } = {}
): Promise<ImageGenerationResult> {
  try {
    console.log('🎨 Generating custom image with prompt:', prompt)

    // Step 1: Generate with DALL-E 3
    const dalleResult = await generateImage({
      prompt,
      ...options,
    })

    // Step 2: Download
    const imageBuffer = await downloadImage(dalleResult.url)

    // Step 3: Apply watermark
    const watermarked = await applyWatermark(imageBuffer, tenantId, {
      position: 'bottom-right',
      opacity: 0.7,
      scale: 0.15,
      margin: 20,
    })

    // Step 4: Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(
      watermarked.buffer,
      'custom-dalle-image.jpg',
      'social-ai/custom'
    )

    return {
      imageUrl: uploadResult.secureUrl,
      optimizedUrl: uploadResult.optimizedUrl,
      dallePrompt: prompt,
      revisedPrompt: dalleResult.revisedPrompt,
      publicId: uploadResult.publicId,
      width: uploadResult.width,
      height: uploadResult.height,
      size: watermarked.size,
    }
  } catch (error: any) {
    console.error('❌ Custom image generation failed:', error)
    throw new Error(`Failed to generate custom image: ${error.message}`)
  }
}
