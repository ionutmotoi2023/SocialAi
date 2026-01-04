import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

/**
 * Get the current user with tenant information from the session
 * Handles both email and id based authentication
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return null
  }

  // Handle both id and email from session
  const userId = (session.user as any).id || (session.user as any).email
  
  const user = await prisma.user.findFirst({
    where: userId.includes('@') 
      ? { email: userId }
      : { id: userId },
    include: { tenant: true },
  })

  return user
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
