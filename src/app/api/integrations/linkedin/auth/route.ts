export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'


export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // 🔍 LOG: Session info
    console.log('🔗 LinkedIn Auth - Session Info:', {
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      tenantId: session?.user?.tenantId,
      role: session?.user?.role,
    })

    if (!session?.user) {
      console.error('❌ LinkedIn Auth - No session found')
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/linkedin/callback`

    // 🔍 LOG: Environment variables
    console.log('🔗 LinkedIn Auth - Config:', {
      clientId: clientId ? `${clientId.substring(0, 8)}...` : 'MISSING',
      redirectUri,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      hasClientSecret: !!process.env.LINKEDIN_CLIENT_SECRET,
    })

    if (!clientId) {
      console.error('❌ LinkedIn Auth - Client ID not configured')
      return NextResponse.json(
        { error: 'LinkedIn Client ID not configured' },
        { status: 500 }
      )
    }

    // Build LinkedIn OAuth URL
    const linkedInAuthUrl = new URL('https://www.linkedin.com/oauth/v2/authorization')
    linkedInAuthUrl.searchParams.append('response_type', 'code')
    linkedInAuthUrl.searchParams.append('client_id', clientId)
    linkedInAuthUrl.searchParams.append('redirect_uri', redirectUri)
    linkedInAuthUrl.searchParams.append('state', session.user.tenantId)
    // Use only authorized scopes (r_emailaddress requires "Sign In with LinkedIn" product)
    linkedInAuthUrl.searchParams.append('scope', 'r_liteprofile w_member_social')

    // 🔍 LOG: Final OAuth URL
    console.log('✅ LinkedIn Auth - Redirecting to:', linkedInAuthUrl.toString())

    return NextResponse.redirect(linkedInAuthUrl.toString())
  } catch (error) {
    console.error('LinkedIn auth error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate LinkedIn OAuth' },
      { status: 500 }
    )
  }
}
