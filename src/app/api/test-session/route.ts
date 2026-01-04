import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('🧪 TEST: Starting session test...')
    
    const session = await getServerSession(authOptions)
    
    console.log('🧪 TEST: Session result:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userId: session?.user?.id
    })
    
    return NextResponse.json({
      success: true,
      hasSession: !!session,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      } : null
    })
  } catch (error: any) {
    console.error('🧪 TEST: Error in test-session:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
