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

        resolve({
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
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

export { cloudinary }
