export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // tenantId
    const error = searchParams.get('error')

    if (error) {
      return new NextResponse(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ error: '${error}' }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' },
      })
    }

    if (!code || !state) {
      throw new Error('Missing code or state parameter')
    }

    const tenantId = state

    // Exchange code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/integrations/linkedin/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      throw new Error(`Token exchange failed: ${JSON.stringify(errorData)}`)
    }

    const tokenData = await tokenResponse.json()
    const { access_token, expires_in } = tokenData

    // Fetch LinkedIn profile
    const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    })

    if (!profileResponse.ok) {
      throw new Error('Failed to fetch LinkedIn profile')
    }

    const profileData = await profileResponse.json()

    // Calculate expiration date
    const expiresAt = new Date(Date.now() + (expires_in || 60 * 24 * 60 * 60) * 1000)

    // Save or update integration
    await prisma.linkedInIntegration.upsert({
      where: { tenantId },
      create: {
        tenantId,
        accessToken: access_token,
        refreshToken: tokenData.refresh_token || null,
        expiresAt,
        linkedinId: profileData.id,
        profileName: `${profileData.localizedFirstName || ''} ${profileData.localizedLastName || ''}`.trim(),
        profileImage: profileData.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier,
        isActive: true,
      },
      update: {
        accessToken: access_token,
        refreshToken: tokenData.refresh_token || null,
        expiresAt,
        linkedinId: profileData.id,
        profileName: `${profileData.localizedFirstName || ''} ${profileData.localizedLastName || ''}`.trim(),
        profileImage: profileData.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier,
        isActive: true,
      },
    })

    // Return success page that closes popup
    return new NextResponse(`
      <html>
        <head>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 3rem;
              border-radius: 1rem;
              text-align: center;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            .success-icon {
              font-size: 4rem;
              margin-bottom: 1rem;
            }
            h1 {
              color: #10b981;
              margin: 0 0 1rem 0;
            }
            p {
              color: #6b7280;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✓</div>
            <h1>LinkedIn Connected!</h1>
            <p>This window will close automatically...</p>
          </div>
          <script>
            setTimeout(() => {
              window.opener.postMessage({ success: true }, '*');
              window.close();
            }, 1500);
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (error: any) {
    console.error('LinkedIn callback error:', error)
    
    return new NextResponse(`
      <html>
        <head>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 3rem;
              border-radius: 1rem;
              text-align: center;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            .error-icon {
              font-size: 4rem;
              margin-bottom: 1rem;
            }
            h1 {
              color: #ef4444;
              margin: 0 0 1rem 0;
            }
            p {
              color: #6b7280;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">✗</div>
            <h1>Connection Failed</h1>
            <p>${error.message || 'Something went wrong'}</p>
          </div>
          <script>
            setTimeout(() => {
              window.opener.postMessage({ error: '${error.message}' }, '*');
              window.close();
            }, 3000);
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    })
  }
}
