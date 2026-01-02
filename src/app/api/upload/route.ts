export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadToCloudinary } from '@/lib/storage/cloudinary'
import { applyWatermark } from '@/lib/image/processor'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const applyBrandWatermark = formData.get('applyWatermark') !== 'false' // Default: true

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max for Cloudinary free tier)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    let buffer = Buffer.from(bytes)

    // Apply watermark if enabled (default: true)
    let watermarked = false
    if (applyBrandWatermark) {
      try {
        console.log('Applying watermark to uploaded image...')
        const processed = await applyWatermark(buffer, session.user.tenantId, {
          position: 'bottom-right',
          opacity: 0.7,
          scale: 0.15,
          margin: 20,
        })
        buffer = processed.buffer
        watermarked = true
        console.log('✅ Watermark applied successfully')
      } catch (watermarkError) {
        console.warn('Watermark application failed, uploading original:', watermarkError)
        // Continue with original image if watermark fails
      }
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(buffer, file.name)

    return NextResponse.json({
      success: true,
      url: result.secureUrl, // URL original pentru UI display
      optimizedUrl: result.optimizedUrl, // URL optimizat pentru GPT-4 Vision
      publicId: result.publicId,
      filename: file.name,
      size: result.bytes,
      type: file.type,
      width: result.width,
      height: result.height,
      format: result.format,
      watermarked, // NEW: Indicates if watermark was applied
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    
    // Provide more specific error messages
    if (error.message.includes('Cloudinary credentials')) {
      return NextResponse.json(
        { error: 'Image upload service not configured. Please contact support.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    )
  }
}

// Optional: GET endpoint to list uploaded files
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // For now, return empty array
    // In production, you might want to store upload metadata in database
    return NextResponse.json({
      files: [],
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    )
  }
}
