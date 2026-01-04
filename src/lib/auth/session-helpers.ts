import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

/**
 * Get the current user with tenant information from the session
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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
