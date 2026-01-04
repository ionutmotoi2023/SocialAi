import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

/**
 * Google Drive Integration for Auto-Pilot
 * Handles OAuth2 authentication and file syncing
 */

// Initialize OAuth2 client
export function getOAuth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/google-drive/callback`

  if (!clientId || !clientSecret) {
    throw new Error('Google Drive credentials not configured. Set GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET.')
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

/**
 * Generate authorization URL for user to connect Drive
 */
export function generateAuthUrl(): string {
  const oauth2Client = getOAuth2Client()

  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Get refresh token
    scope: [
      'https://www.googleapis.com/auth/drive.readonly', // Read-only access to files
      'https://www.googleapis.com/auth/drive.metadata.readonly', // Read metadata
    ],
    prompt: 'consent', // Force consent screen to get refresh token
  })
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  const { credentials } = await oauth2Client.refreshAccessToken()
  return credentials
}

/**
 * List files in a specific folder
 */
export async function listFiles(
  accessToken: string,
  options: {
    folderId?: string
    folderPath?: string
    mimeTypes?: string[] // e.g., ['image/jpeg', 'image/png', 'video/mp4']
    pageSize?: number
    pageToken?: string
    modifiedAfter?: Date // Only files modified after this date
  } = {}
) {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ access_token: accessToken })

  const drive = google.drive({ version: 'v3', auth: oauth2Client })

  // Build query
  let query = ''
  const queryParts: string[] = []

  // Filter by folder
  if (options.folderId) {
    queryParts.push(`'${options.folderId}' in parents`)
  }

  // Filter by MIME types (images/videos only)
  if (options.mimeTypes && options.mimeTypes.length > 0) {
    const mimeQuery = options.mimeTypes.map(type => `mimeType='${type}'`).join(' or ')
    queryParts.push(`(${mimeQuery})`)
  } else {
    // Default: only images and videos
    queryParts.push(`(mimeType contains 'image/' or mimeType contains 'video/')`)
  }

  // Filter by modified date
  if (options.modifiedAfter) {
    const isoDate = options.modifiedAfter.toISOString()
    queryParts.push(`modifiedTime > '${isoDate}'`)
  }

  // Not in trash
  queryParts.push(`trashed = false`)

  query = queryParts.join(' and ')

  const response = await drive.files.list({
    q: query,
    pageSize: options.pageSize || 100,
    pageToken: options.pageToken,
    fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webContentLink, thumbnailLink, parents)',
    orderBy: 'createdTime desc', // Newest first
  })

  return {
    files: response.data.files || [],
    nextPageToken: response.data.nextPageToken,
  }
}

/**
 * Download file content
 */
export async function downloadFile(
  accessToken: string,
  fileId: string
): Promise<Buffer> {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ access_token: accessToken })

  const drive = google.drive({ version: 'v3', auth: oauth2Client })

  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  )

  return Buffer.from(response.data as ArrayBuffer)
}

/**
 * Get file metadata
 */
export async function getFileMetadata(accessToken: string, fileId: string) {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ access_token: accessToken })

  const drive = google.drive({ version: 'v3', auth: oauth2Client })

  const response = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size, createdTime, modifiedTime, webContentLink, thumbnailLink, parents, imageMediaMetadata, videoMediaMetadata',
  })

  return response.data
}

/**
 * Get folder ID from path (e.g., "/Social Media/Photos")
 * Returns root folder ID if path is "/"
 */
export async function getFolderIdFromPath(
  accessToken: string,
  folderPath: string
): Promise<string | null> {
  if (folderPath === '/' || folderPath === '') {
    return 'root'
  }

  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ access_token: accessToken })

  const drive = google.drive({ version: 'v3', auth: oauth2Client })

  // Split path into parts
  const parts = folderPath.split('/').filter(p => p.length > 0)

  let currentFolderId = 'root'

  // Navigate through folder structure
  for (const folderName of parts) {
    const response = await drive.files.list({
      q: `name='${folderName}' and '${currentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      pageSize: 1,
    })

    if (!response.data.files || response.data.files.length === 0) {
      return null // Folder not found
    }

    currentFolderId = response.data.files[0].id!
  }

  return currentFolderId
}

/**
 * Test Drive connection and permissions
 */
export async function testConnection(accessToken: string): Promise<boolean> {
  try {
    const oauth2Client = getOAuth2Client()
    oauth2Client.setCredentials({ access_token: accessToken })

    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    // Try to get user's Drive info
    const response = await drive.about.get({ fields: 'user, storageQuota' })

    return !!response.data.user
  } catch (error) {
    console.error('Drive connection test failed:', error)
    return false
  }
}

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  createdTime?: string
  modifiedTime?: string
  webContentLink?: string
  thumbnailLink?: string
  parents?: string[]
}

export interface DriveFolder {
  id: string
  name: string
  path: string
  hasChildren: boolean
}

/**
 * List folders in a specific folder (for folder picker)
 */
export async function listFolders(
  accessToken: string,
  parentFolderId: string = 'root'
): Promise<DriveFolder[]> {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ access_token: accessToken })

  const drive = google.drive({ version: 'v3', auth: oauth2Client })

  // Query for folders only
  const query = `'${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`

  const response = await drive.files.list({
    q: query,
    pageSize: 100,
    fields: 'files(id, name)',
    orderBy: 'name',
  })

  const folders: DriveFolder[] = []

  for (const folder of response.data.files || []) {
    // Check if folder has children (subfolders)
    const childQuery = `'${folder.id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    const childResponse = await drive.files.list({
      q: childQuery,
      pageSize: 1,
      fields: 'files(id)',
    })

    folders.push({
      id: folder.id!,
      name: folder.name!,
      path: '', // Will be computed on frontend
      hasChildren: (childResponse.data.files?.length || 0) > 0,
    })
  }

  return folders
}
