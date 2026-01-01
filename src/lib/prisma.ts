import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Row-Level Security helpers for multi-tenancy
export function withTenant(tenantId: string) {
  return {
    where: {
      tenantId,
    },
  }
}

export function withTenantAndUser(tenantId: string, userId: string) {
  return {
    where: {
      tenantId,
      userId,
    },
  }
}