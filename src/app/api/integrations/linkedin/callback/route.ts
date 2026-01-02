export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // tenantId
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // 🔍 LOG: Callback parameters
    console.log('🔙 LinkedIn Callback - Received:', {
      hasCode: !!code,
      codePreview: code ? `${code.substring(0, 10)}...` : null,
      state: state,
      error: error,
      errorDescription: errorDescription,
    })

    if (error) {
      console.error('❌ LinkedIn Callback - OAuth error:', { error, errorDescription })
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
      console.error('❌ LinkedIn Callback - Missing parameters:', { code: !!code, state: !!state })
      throw new Error('Missing code or state parameter')
    }

    const tenantId = state

    console.log('🔍 LinkedIn Callback - Exchanging code for token...')

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

    // 🔍 LOG: Token response status
    console.log('🔍 LinkedIn Callback - Token response:', {
      status: tokenResponse.status,
      ok: tokenResponse.ok,
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('❌ LinkedIn Callback - Token exchange failed:', errorData)
      throw new Error(`Token exchange failed: ${JSON.stringify(errorData)}`)
    }

    const tokenData = await tokenResponse.json()
    const { access_token, expires_in } = tokenData

    console.log('✅ LinkedIn Callback - Token received:', {
      hasAccessToken: !!access_token,
      expiresIn: expires_in,
      hasRefreshToken: !!tokenData.refresh_token,
    })

    console.log('🔍 LinkedIn Callback - Fetching profile...')

    // Fetch LinkedIn profile using OpenID Connect UserInfo endpoint
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    // Fetch organizations (to detect if user manages a company page)
    console.log('🔍 LinkedIn Callback - Fetching organizations...')
    const orgsResponse = await fetch(
      'https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&projection=(elements*(organizationalTarget~(localizedName,vanityName)))',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'LinkedIn-Version': '202401',
        },
      }
    )

    let organizations: any[] = []
    if (orgsResponse.ok) {
      const orgsData = await orgsResponse.json()
      organizations = orgsData.elements || []
      console.log('✅ LinkedIn Callback - Organizations found:', {
        count: organizations.length,
        orgs: organizations.map((org: any) => ({
          id: org['organizationalTarget~']?.id,
          name: org['organizationalTarget~']?.localizedName,
          role: org.role, // Log user's role on this organization
          state: org.state, // Log state (APPROVED, PENDING, etc)
        })),
      })
    } else {
      const errorText = await orgsResponse.text()
      console.log('⚠️ LinkedIn Callback - Could not fetch organizations:', {
        status: orgsResponse.status,
        error: errorText,
      })
    }

    // 🔍 LOG: Profile response
    console.log('🔍 LinkedIn Callback - Profile response:', {
      status: profileResponse.status,
      ok: profileResponse.ok,
    })

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text()
      console.error('❌ LinkedIn Callback - Profile fetch failed:', errorText)
      throw new Error('Failed to fetch LinkedIn profile')
    }

    const profileData = await profileResponse.json()

    // 🔍 LOG: Profile data received (OpenID Connect format)
    console.log('✅ LinkedIn Callback - Profile data:', {
      linkedinId: profileData.sub,
      name: profileData.name,
      givenName: profileData.given_name,
      familyName: profileData.family_name,
      picture: profileData.picture,
    })

    console.log('🔍 LinkedIn Callback - Organizations found:', {
      count: organizations.length,
      orgs: organizations.map((org: any) => ({
        id: org['organizationalTarget~']?.id,
        name: org['organizationalTarget~']?.localizedName,
      })),
    })

    // Calculate expiration date
    const expiresAt = new Date(Date.now() + (expires_in || 60 * 24 * 60 * 60) * 1000)

    console.log('💾 LinkedIn Callback - Saving to database...', {
      tenantId,
      linkedinId: profileData.sub,
      organizationsCount: organizations.length,
      expiresAt: expiresAt.toISOString(),
    })

    // STEP 1: Save Personal Profile Integration
    console.log('💾 Saving Personal Profile...')
    await prisma.linkedInIntegration.upsert({
      where: { 
        tenantId_linkedinId: {
          tenantId,
          linkedinId: profileData.sub,
        }
      },
      create: {
        tenantId,
        accessToken: access_token,
        refreshToken: tokenData.refresh_token || null,
        expiresAt,
        linkedinId: profileData.sub,
        profileName: profileData.name || `${profileData.given_name || ''} ${profileData.family_name || ''}`.trim(),
        profileImage: profileData.picture,
        profileType: 'PERSONAL',
        organizationId: null,
        organizationName: null,
        organizationUrn: null,
        isActive: true,
      },
      update: {
        accessToken: access_token,
        refreshToken: tokenData.refresh_token || null,
        expiresAt,
        profileName: profileData.name || `${profileData.given_name || ''} ${profileData.family_name || ''}`.trim(),
        profileImage: profileData.picture,
        profileType: 'PERSONAL',
        organizationId: null,
        organizationName: null,
        organizationUrn: null,
        isActive: true,
      },
    })
    console.log('✅ Personal Profile saved')

    // STEP 2: Save Each Organization as Separate Integration
    if (organizations.length > 0) {
      console.log('💾 Saving Organizations...', organizations.length)
      
      for (const org of organizations) {
        const orgId = org['organizationalTarget~']?.id
        const orgName = org['organizationalTarget~']?.localizedName
        const orgUrn = org.organizationalTarget
        const orgRole = org.role // ADMINISTRATOR, EDITOR, etc
        const orgState = org.state // APPROVED, PENDING, etc

        if (!orgId) {
          console.log('⚠️ Skipping organization without ID')
          continue
        }

        console.log('💾 Saving organization:', { 
          orgId, 
          orgName, 
          role: orgRole,
          state: orgState,
          urn: orgUrn,
        })

        // ⚠️ Warn if user doesn't have ADMINISTRATOR role
        if (orgRole !== 'ADMINISTRATOR') {
          console.warn('⚠️ WARNING: User does not have ADMINISTRATOR role on organization:', {
            orgName,
            currentRole: orgRole,
            required: 'ADMINISTRATOR',
            impact: 'Posting to this organization may fail!',
          })
        }

        // Use organization ID as linkedinId for company pages
        await prisma.linkedInIntegration.upsert({
          where: { 
            tenantId_linkedinId: {
              tenantId,
              linkedinId: orgId, // Use org ID as unique identifier
            }
          },
          create: {
            tenantId,
            accessToken: access_token,
            refreshToken: tokenData.refresh_token || null,
            expiresAt,
            linkedinId: orgId,
            profileName: orgName,
            profileImage: profileData.picture, // Use user's profile image as fallback
            profileType: 'COMPANY_PAGE',
            organizationId: orgId,
            organizationName: orgName,
            organizationUrn: orgUrn,
            isActive: true,
          },
          update: {
            accessToken: access_token,
            refreshToken: tokenData.refresh_token || null,
            expiresAt,
            profileName: orgName,
            profileImage: profileData.picture,
            profileType: 'COMPANY_PAGE',
            organizationId: orgId,
            organizationName: orgName,
            organizationUrn: orgUrn,
            isActive: true,
          },
        })
        
        console.log('✅ Organization saved:', orgName)
      }
      
      console.log('✅ All organizations saved:', organizations.length)
    }

    console.log('✅ LinkedIn Callback - Successfully connected!', {
      personal: 1,
      organizations: organizations.length,
      total: 1 + organizations.length,
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
