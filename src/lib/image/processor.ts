import sharp from 'sharp'
import { prisma } from '@/lib/prisma'
import fetch from 'node-fetch'

export interface WatermarkOptions {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  opacity?: number
  scale?: number // 0.1 to 1.0 (percentage of image width)
  margin?: number // pixels from edge
}

export interface ProcessedImage {
  buffer: Buffer
  width: number
  height: number
  format: string
  size: number
}

/**
 * Download image from URL to buffer
 */
export async function downloadImage(imageUrl: string): Promise<Buffer> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error: any) {
    console.error('Image download error:', error)
    throw new Error(`Failed to download image: ${error.message}`)
  }
}

/**
 * Apply watermark/logo to image using Brand Asset
 */
export async function applyWatermark(
  imageBuffer: Buffer,
  tenantId: string,
  options: WatermarkOptions = {}
): Promise<ProcessedImage> {
  try {
    // Get default brand asset (logo)
    const brandAsset = await prisma.brandAsset.findFirst({
      where: {
        tenantId,
        type: 'logo',
        isDefault: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!brandAsset) {
      console.warn('No default brand asset found, returning original image')
      // Return original image if no brand asset
      const metadata = await sharp(imageBuffer).metadata()
      return {
        buffer: imageBuffer,
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'jpeg',
        size: imageBuffer.length,
      }
    }

    // Download logo
    const logoBuffer = await downloadImage(brandAsset.fileUrl)

    // Get original image metadata
    const imageMetadata = await sharp(imageBuffer).metadata()
    const imageWidth = imageMetadata.width || 1024
    const imageHeight = imageMetadata.height || 1024

    // Parse watermark settings from brand asset
    const watermarkSettings = (brandAsset.watermarkSettings as any) || {}
    const position = options.position || watermarkSettings.position || 'bottom-right'
    const opacity = options.opacity ?? watermarkSettings.opacity ?? 0.7
    const scale = options.scale ?? watermarkSettings.scale ?? 0.15
    const margin = options.margin ?? watermarkSettings.margin ?? 20

    // Calculate logo size (scale based on image width)
    const logoWidth = Math.round(imageWidth * scale)

    // Resize and prepare logo
    const resizedLogo = await sharp(logoBuffer)
      .resize(logoWidth, null, {
        fit: 'contain',
        withoutEnlargement: true,
      })
      .png() // Convert to PNG for transparency
      .toBuffer()

    // Get resized logo metadata
    const logoMetadata = await sharp(resizedLogo).metadata()
    const logoHeight = logoMetadata.height || 0

    // Calculate position
    let left = 0
    let top = 0

    switch (position) {
      case 'top-left':
        left = margin
        top = margin
        break
      case 'top-right':
        left = imageWidth - logoWidth - margin
        top = margin
        break
      case 'bottom-left':
        left = margin
        top = imageHeight - logoHeight - margin
        break
      case 'bottom-right':
        left = imageWidth - logoWidth - margin
        top = imageHeight - logoHeight - margin
        break
      case 'center':
        left = Math.round((imageWidth - logoWidth) / 2)
        top = Math.round((imageHeight - logoHeight) / 2)
        break
    }

    // Apply watermark with opacity
    const watermarkedBuffer = await sharp(imageBuffer)
      .composite([
        {
          input: await sharp(resizedLogo)
            .ensureAlpha()
            .modulate({ brightness: 1 })
            .toBuffer()
            .then(buf =>
              sharp(buf)
                .composite([
                  {
                    input: Buffer.from([255, 255, 255, Math.round(opacity * 255)]),
                    raw: { width: 1, height: 1, channels: 4 },
                    tile: true,
                    blend: 'dest-in',
                  },
                ])
                .toBuffer()
            ),
          left,
          top,
        },
      ])
      .jpeg({ quality: 90 })
      .toBuffer()

    const metadata = await sharp(watermarkedBuffer).metadata()

    return {
      buffer: watermarkedBuffer,
      width: metadata.width || imageWidth,
      height: metadata.height || imageHeight,
      format: metadata.format || 'jpeg',
      size: watermarkedBuffer.length,
    }
  } catch (error: any) {
    console.error('Watermark application error:', error)
    throw new Error(`Failed to apply watermark: ${error.message}`)
  }
}

/**
 * Optimize image (compress, resize if needed)
 */
export async function optimizeImage(
  imageBuffer: Buffer,
  maxWidth: number = 2048,
  maxHeight: number = 2048,
  quality: number = 85
): Promise<ProcessedImage> {
  try {
    const metadata = await sharp(imageBuffer).metadata()
    const needsResize =
      (metadata.width && metadata.width > maxWidth) ||
      (metadata.height && metadata.height > maxHeight)

    let pipeline = sharp(imageBuffer)

    if (needsResize) {
      pipeline = pipeline.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
    }

    const optimizedBuffer = await pipeline.jpeg({ quality }).toBuffer()

    const optimizedMetadata = await sharp(optimizedBuffer).metadata()

    return {
      buffer: optimizedBuffer,
      width: optimizedMetadata.width || 0,
      height: optimizedMetadata.height || 0,
      format: optimizedMetadata.format || 'jpeg',
      size: optimizedBuffer.length,
    }
  } catch (error: any) {
    console.error('Image optimization error:', error)
    throw new Error(`Failed to optimize image: ${error.message}`)
  }
}

/**
 * Process image: optimize + apply watermark
 */
export async function processImage(
  imageBuffer: Buffer,
  tenantId: string,
  options: WatermarkOptions = {}
): Promise<ProcessedImage> {
  try {
    // First optimize
    const optimized = await optimizeImage(imageBuffer)

    // Then apply watermark
    const watermarked = await applyWatermark(optimized.buffer, tenantId, options)

    return watermarked
  } catch (error: any) {
    console.error('Image processing error:', error)
    throw new Error(`Failed to process image: ${error.message}`)
  }
}

/**
 * Convert image URL to data URI (for embedding)
 */
export async function imageToDataUri(imageUrl: string): Promise<string> {
  try {
    const buffer = await downloadImage(imageUrl)
    const base64 = buffer.toString('base64')
    const metadata = await sharp(buffer).metadata()
    const mimeType = `image/${metadata.format || 'jpeg'}`
    return `data:${mimeType};base64,${base64}`
  } catch (error: any) {
    console.error('Image to data URI error:', error)
    throw new Error(`Failed to convert image to data URI: ${error.message}`)
  }
}
