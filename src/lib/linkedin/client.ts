import { prisma } from '../prisma'

export interface LinkedInProfile {
  id: string
  firstName: string
  lastName: string
  profilePicture?: string
  vanityName?: string
}

export interface LinkedInShareResponse {
  id: string
  activity: string
}

export class LinkedInClient {
  private accessToken: string
  private tenantId: string

  constructor(accessToken: string, tenantId: string) {
    this.accessToken = accessToken
    this.tenantId = tenantId
  }

  // Get LinkedIn profile information (OpenID Connect UserInfo endpoint)
  async getProfile(): Promise<LinkedInProfile> {
    try {
      const response = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`LinkedIn API error: ${response.statusText}`)
      }

      const data = await response.json()

      // OpenID Connect response format
      return {
        id: data.sub, // OpenID Connect subject (LinkedIn member ID)
        firstName: data.given_name || data.name?.split(' ')[0] || '',
        lastName: data.family_name || data.name?.split(' ').slice(1).join(' ') || '',
        profilePicture: data.picture,
        vanityName: data.vanityName || '',
      }
    } catch (error) {
      console.error('LinkedIn profile fetch error:', error)
      throw error
    }
  }

  // Share text post to LinkedIn
  async shareTextPost(text: string): Promise<LinkedInShareResponse> {
    try {
      const profile = await this.getProfile()
      const authorUrn = `urn:li:person:${profile.id}`

      const shareData = {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: text,
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }

      const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'LinkedIn-Version': '202401', // Use latest API version
        },
        body: JSON.stringify(shareData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`LinkedIn post error: ${JSON.stringify(errorData)}`)
      }

      const data = await response.json()

      return {
        id: data.id,
        activity: data.activity || '',
      }
    } catch (error) {
      console.error('LinkedIn share error:', error)
      throw error
    }
  }

  // Register image upload with LinkedIn and get asset URN
  private async registerImageUpload(imageUrl: string): Promise<{ uploadUrl: string; asset: string }> {
    try {
      const profile = await this.getProfile()
      const authorUrn = `urn:li:person:${profile.id}`

      // Step 1: Register upload
      const registerData = {
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: authorUrn,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent',
            },
          ],
        },
      }

      const registerResponse = await fetch(
        'https://api.linkedin.com/v2/assets?action=registerUpload',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'LinkedIn-Version': '202401',
          },
          body: JSON.stringify(registerData),
        }
      )

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json()
        throw new Error(`LinkedIn register upload error: ${JSON.stringify(errorData)}`)
      }

      const registerResult = await registerResponse.json()
      const uploadUrl = registerResult.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl
      const asset = registerResult.value.asset

      console.log('✅ LinkedIn image registered:', { asset, hasUploadUrl: !!uploadUrl })

      // Step 2: Download image from URL
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image from ${imageUrl}`)
      }
      const imageBuffer = await imageResponse.arrayBuffer()

      console.log('✅ Image downloaded:', { size: imageBuffer.byteLength, url: imageUrl })

      // Step 3: Upload image binary to LinkedIn
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/octet-stream',
        },
        body: imageBuffer,
      })

      if (!uploadResponse.ok) {
        throw new Error(`LinkedIn image upload error: ${uploadResponse.statusText}`)
      }

      console.log('✅ Image uploaded to LinkedIn successfully')

      return { uploadUrl, asset }
    } catch (error) {
      console.error('LinkedIn image registration/upload error:', error)
      throw error
    }
  }

  // Share post with image to LinkedIn
  async shareImagePost(text: string, imageUrl: string): Promise<LinkedInShareResponse> {
    try {
      console.log('📸 LinkedIn Image Post - Starting:', { textLength: text.length, imageUrl })

      const profile = await this.getProfile()
      const authorUrn = `urn:li:person:${profile.id}`

      // Register and upload image to LinkedIn
      const { asset } = await this.registerImageUpload(imageUrl)

      console.log('📤 Creating LinkedIn post with image asset:', asset)

      // Create share with registered image asset
      const shareData = {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: text,
            },
            shareMediaCategory: 'IMAGE',
            media: [
              {
                status: 'READY',
                description: {
                  text: 'Image',
                },
                media: asset, // Use the registered asset URN
                title: {
                  text: 'Shared Image',
                },
              },
            ],
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }

      const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'LinkedIn-Version': '202401',
        },
        body: JSON.stringify(shareData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`LinkedIn image post error: ${JSON.stringify(errorData)}`)
      }

      const data = await response.json()

      console.log('✅ LinkedIn image post created successfully:', data.id)

      return {
        id: data.id,
        activity: data.activity || '',
      }
    } catch (error) {
      console.error('LinkedIn image share error:', error)
      throw error
    }
  }

  // Refresh access token
  static async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to refresh LinkedIn token')
      }

      const data = await response.json()
      return data.access_token
    } catch (error) {
      console.error('LinkedIn token refresh error:', error)
      throw error
    }
  }

  // Get LinkedIn client for a tenant
  static async getClientForTenant(tenantId: string): Promise<LinkedInClient> {
    const integration = await prisma.linkedInIntegration.findUnique({
      where: { tenantId },
    })

    if (!integration) {
      throw new Error('LinkedIn integration not found for this tenant')
    }

    if (!integration.isActive) {
      throw new Error('LinkedIn integration is not active')
    }

    // Check if token is expired and refresh if needed
    if (integration.expiresAt && integration.expiresAt < new Date()) {
      if (!integration.refreshToken) {
        throw new Error('LinkedIn token expired and no refresh token available')
      }

      const newAccessToken = await this.refreshAccessToken(integration.refreshToken)

      // Update token in database
      await prisma.linkedInIntegration.update({
        where: { id: integration.id },
        data: {
          accessToken: newAccessToken,
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        },
      })

      return new LinkedInClient(newAccessToken, tenantId)
    }

    return new LinkedInClient(integration.accessToken, tenantId)
  }
}

// Helper function for easy publishing
export async function publishToLinkedIn(
  integration: { accessToken: string; tenantId: string },
  content: { text: string; images?: string[] }
): Promise<string> {
  const client = new LinkedInClient(integration.accessToken, integration.tenantId)
  
  if (content.images && content.images.length > 0) {
    // Use first image for now (LinkedIn API requires special handling for multiple images)
    const response = await client.shareImagePost(content.text, content.images[0])
    return response.activity
  } else {
    const response = await client.shareTextPost(content.text)
    return response.activity
  }
}
