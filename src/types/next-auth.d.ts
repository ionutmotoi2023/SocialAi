import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'USER'
      tenantId: string
      tenant?: {
        id: string
        name: string
        domain?: string | null
        logo?: string | null
      }
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'USER'
    tenantId: string
    tenant?: {
      id: string
      name: string
      domain?: string | null
      logo?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'USER'
    tenantId: string
    tenant?: {
      id: string
      name: string
      domain?: string | null
      logo?: string | null
    }
  }
}
