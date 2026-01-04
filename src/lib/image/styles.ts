import { prisma } from '@/lib/prisma'
import { ImageStyle, ImageStylesConfig, BUILTIN_IMAGE_STYLES } from '@/types/image-styles'

/**
 * Get image styles for a tenant
 * Returns custom styles if configured, otherwise returns built-in defaults
 */
export async function getTenantImageStyles(tenantId: string): Promise<ImageStylesConfig> {
  const aiConfig = await prisma.aIConfig.findUnique({
    where: { tenantId },
    select: {
      imageStyles: true,
      defaultImageStyle: true,
    },
  })

  if (aiConfig?.imageStyles) {
    return aiConfig.imageStyles as ImageStylesConfig
  }

  // Return default styles
  return {
    styles: BUILTIN_IMAGE_STYLES,
    defaultStyleId: 'professional',
  }
}

/**
 * Get a specific image style by ID
 */
export async function getImageStyleById(
  tenantId: string,
  styleId: string
): Promise<ImageStyle | null> {
  const config = await getTenantImageStyles(tenantId)
  const style = config.styles.find(s => s.id === styleId && s.isActive)
  return style || null
}

/**
 * Get the default image style for a tenant
 */
export async function getDefaultImageStyle(tenantId: string): Promise<ImageStyle> {
  const config = await getTenantImageStyles(tenantId)
  const defaultStyle = config.styles.find(s => s.id === config.defaultStyleId)
  
  // Fallback to first active style or professional
  return defaultStyle || config.styles.find(s => s.isActive) || BUILTIN_IMAGE_STYLES[0]
}

/**
 * Get style prompt by ID (with fallback)
 */
export async function getStylePrompt(
  tenantId: string,
  styleId?: string
): Promise<string> {
  if (!styleId) {
    const defaultStyle = await getDefaultImageStyle(tenantId)
    return defaultStyle.prompt
  }

  const style = await getImageStyleById(tenantId, styleId)
  if (style) {
    return style.prompt
  }

  // Fallback to default
  const defaultStyle = await getDefaultImageStyle(tenantId)
  return defaultStyle.prompt
}
