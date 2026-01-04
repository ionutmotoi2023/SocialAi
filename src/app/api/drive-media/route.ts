import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/drive-media
 * Fetch all synced media for the current tenant
 */
export async function GET(req: NextRequest) {
  try {
    // Get session directly
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, tenantId: true, email: true }
    })

    console.log('👤 User lookup:', {
      userId: session.user.id,
      userEmail: session.user.email,
      foundUser: !!user,
      tenantId: user?.tenantId
    })

    if (!user || !user.tenantId) {
      console.error('❌ No tenant found for user:', session.user.id)
      return NextResponse.json(
        { error: 'No tenant found' },
        { status: 404 }
      )
    }

    // Fetch synced media
    console.log('🔍 Fetching synced media for tenant:', user.tenantId)
    
    const media = await prisma.syncedMedia.findMany({
      where: {
        tenantId: user.tenantId,
      },
      orderBy: {
        syncedAt: 'desc',
      },
      take: 100, // Limit to 100 most recent
    })

    console.log('📊 Found synced media:', {
      count: media.length,
      files: media.map(m => ({ 
        id: m.id, 
        fileName: m.originalFileName,
        syncedAt: m.syncedAt 
      }))
    })

    // Map database fields to UI interface
    const mappedMedia = media.map(item => ({
      id: item.id,
      fileName: item.originalFileName,
      mediaUrl: item.localUrl || item.originalFileUrl,
      mediaType: item.mediaType.toUpperCase() as 'IMAGE' | 'VIDEO',
      fileSize: item.fileSize || 0,
      status: item.processingStatus,
      aiAnalysisResult: item.aiAnalysisResult,
      aiDescription: item.aiDescription,
      aiSuggestedTopics: item.aiSuggestedTopics,
      isGrouped: item.isGrouped,
      postGenerated: item.postGenerated,
      postId: item.postId,
      createdAt: item.syncedAt.toISOString(),
      updatedAt: item.lastProcessedAt?.toISOString() || item.syncedAt.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      media: mappedMedia,
      count: mappedMedia.length,
    })
  } catch (error: any) {
    console.error('Error fetching synced media:', error)
    return NextResponse.json(
      { error: 'Failed to fetch synced media', details: error.message },
      { status: 500 }
    )
  }
}
