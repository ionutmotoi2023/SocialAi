export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/linkedin/callback`

    if (!clientId) {
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
    linkedInAuthUrl.searchParams.append('scope', 'r_liteprofile r_emailaddress w_member_social')

    return NextResponse.redirect(linkedInAuthUrl.toString())
  } catch (error) {
    console.error('LinkedIn auth error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate LinkedIn OAuth' },
      { status: 500 }
    )
  }
}
