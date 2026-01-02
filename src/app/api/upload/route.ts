export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadToCloudinary } from '@/lib/storage/cloudinary'

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
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const result = await uploadToCloudinary(buffer, file.name)

    return NextResponse.json({
      success: true,
      url: result.secureUrl, // Use secure HTTPS URL
      publicId: result.publicId,
      filename: file.name,
      size: result.bytes,
      type: file.type,
      width: result.width,
      height: result.height,
      format: result.format,
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
