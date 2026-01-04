import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

/**
 * Get the current user with tenant information from the session
 */
export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('🔍 Session debug:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    })
    
    if (!session?.user?.id) {
      console.log('⚠️ No session or user ID found')
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { tenant: true },
    })

    if (!user) {
      console.log('⚠️ User not found in database:', session.user.id)
      return null
    }

    console.log('✅ User found:', { id: user.id, tenantId: user.tenantId, email: user.email })
    return user
  } catch (error) {
    console.error('❌ Error in getCurrentUser():', error)
    return null
  }
}

/**
 * Get tenant ID from session
 * Throws error if user or tenant not found
 */
export async function requireTenantId() {
  const user = await getCurrentUser()
  
  if (!user || !user.tenantId) {
    throw new Error('No tenant found')
  }

  return user.tenantId
}
