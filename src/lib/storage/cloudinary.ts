import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
// Only initialize if credentials are available
if (process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_API_KEY && 
    process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
}

export interface UploadResult {
  url: string
  secureUrl: string
  publicId: string
  width: number
  height: number
  format: string
  bytes: number
  optimizedUrl?: string  // URL optimizat pentru GPT-4 Vision
}

/**
 * Upload an image buffer to Cloudinary
 * @param buffer - Image buffer to upload
 * @param filename - Original filename (for public_id)
 * @param folder - Cloudinary folder path (default: 'social-ai')
 * @returns Upload result with URLs and metadata
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  folder: string = 'social-ai'
): Promise<UploadResult> {
  // Check if Cloudinary is configured
  if (!process.env.CLOUDINARY_CLOUD_NAME || 
      !process.env.CLOUDINARY_API_KEY || 
      !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary credentials not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.')
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: `${Date.now()}-${filename.replace(/\.[^/.]+$/, '')}`,
        resource_type: 'image',
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Upload failed'))
          return
        }

        // Generate optimized URL for GPT-4 Vision
        const optimizedUrl = getGPT4OptimizedUrl(result.public_id)

        resolve({
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          optimizedUrl, // URL optimizat pentru GPT-4 Vision
        })
      }
    )

    uploadStream.end(buffer)
  })
}

/**
 * Delete an image from Cloudinary
 * @param publicId - Public ID of the image to delete
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error('Cloudinary not configured')
  }

  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Failed to delete from Cloudinary:', error)
    throw error
  }
}

/**
 * Get optimized URL for an image
 * @param publicId - Public ID of the image
 * @param width - Desired width
 * @param height - Desired height
 * @param crop - Crop mode (default: 'fill')
 */
export function getOptimizedUrl(
  publicId: string,
  width?: number,
  height?: number,
  crop: string = 'fill'
): string {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error('Cloudinary not configured')
  }

  return cloudinary.url(publicId, {
    width,
    height,
    crop,
    quality: 'auto',
    fetch_format: 'auto',
  })
}

/**
 * Get GPT-4 Vision optimized URL
 * Generates a smaller, WebP version optimized for AI analysis
 * - Max width: 1024px (optimal for GPT-4 Vision cost/quality ratio)
 * - Format: WebP (smaller file size)
 * - Quality: eco (sufficient for AI analysis)
 * 
 * Benefits:
 * - ~67% cost reduction for GPT-4 Vision API calls
 * - Faster upload to OpenAI
 * - Same analysis quality
 * 
 * @param publicId - Public ID of the image
 * @returns Optimized URL for GPT-4 Vision
 */
export function getGPT4OptimizedUrl(publicId: string): string {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error('Cloudinary not configured')
  }

  return cloudinary.url(publicId, {
    width: 1024,           // Max 1024px width (optimal for GPT-4)
    quality: 'auto:eco',   // Lower quality, still good for AI
    fetch_format: 'webp',  // WebP format (smaller size)
    crop: 'limit',         // Don't upscale small images
    flags: 'lossy',        // Allow lossy compression
  })
}

export { cloudinary }
