/**
 * Image Style Configuration Types
 * Allows tenants to define custom image generation styles
 */

export interface ImageStyle {
  id: string
  name: string // e.g., "Professional", "Lifestyle", "Creative"
  prompt: string // DALL-E prompt instructions for this style
  description?: string // User-friendly description
  isDefault: boolean // Is this the default style for the tenant?
  isActive: boolean // Can users select this style?
  createdAt?: string
  updatedAt?: string
}

export interface ImageStylesConfig {
  styles: ImageStyle[]
  defaultStyleId: string
}

/**
 * Built-in style presets that tenants can use as starting points
 */
export const BUILTIN_IMAGE_STYLES: ImageStyle[] = [
  {
    id: 'professional',
    name: 'Professional',
    prompt: 'Clean, professional, business-appropriate visual. High quality, corporate aesthetic. Modern office environment.',
    description: 'Corporate, business-focused imagery. Perfect for B2B and professional services.',
    isDefault: true,
    isActive: true,
  },
  {
    id: 'creative',
    name: 'Creative',
    prompt: 'Creative artistic photography, photo-realistic with artistic flair, eye-catching unique composition, bold vibrant colors, conceptual visual storytelling, professional photography with creative twist, interesting angles and perspectives, magazine editorial style, dramatic lighting, high detail, modern aesthetic, innovative visual design.',
    description: 'Artistic and unique designs. Great for creative industries and brand storytelling.',
    isDefault: false,
    isActive: true,
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    prompt: 'Minimalist, simple, elegant design. Clean lines, subtle colors, modern aesthetic. Uncluttered composition.',
    description: 'Simple and elegant. Works well for tech, design, and luxury brands.',
    isDefault: false,
    isActive: true,
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    prompt: 'Professional lifestyle photography, photo-realistic, DSLR camera quality, attractive confident person in authentic real-life scenario, natural soft lighting, shallow depth of field, 35mm portrait lens, high detail, modern aesthetic, vibrant warm colors, aspirational feel, editorial quality, professional model, fashion photography style, authentic natural expression, studio-quality lighting, realistic skin texture.',
    description: 'Human-focused, aspirational imagery. Perfect for fashion, wellness, and consumer brands.',
    isDefault: false,
    isActive: true,
  },
  {
    id: 'bold',
    name: 'Bold',
    prompt: 'Bold vibrant photography, photo-realistic DSLR quality, attention-grabbing visual with strong saturated colors, dynamic energetic composition, high contrast lighting, dramatic shadows, wide-angle lens perspective, professional editorial style, confident attractive model or eye-catching subject, fashion-forward aesthetic, visual impact, magazine cover quality.',
    description: 'Eye-catching and energetic. Great for social media, events, and marketing campaigns.',
    isDefault: false,
    isActive: true,
  },
  {
    id: 'luxury',
    name: 'Luxury',
    prompt: 'High-end luxury photography, photo-realistic DSLR quality, premium materials and sophisticated composition, elegant refined aesthetic, professional model or product styling, rich warm colors, shallow depth of field, editorial fashion photography style, studio lighting setup, 50mm portrait lens, high detail textures, aspirational upscale atmosphere.',
    description: 'Premium and sophisticated. Ideal for luxury brands, real estate, and high-end products.',
    isDefault: false,
    isActive: true,
  },
  {
    id: 'casual',
    name: 'Casual',
    prompt: 'Casual, friendly, approachable visuals. Warm colors, relaxed atmosphere, everyday scenarios. Welcoming and relatable.',
    description: 'Friendly and relatable. Perfect for community-focused brands and small businesses.',
    isDefault: false,
    isActive: true,
  },
  {
    id: 'tech',
    name: 'Tech / Futuristic',
    prompt: 'Modern technology, futuristic design, digital interfaces, innovative concepts. Sleek, high-tech aesthetic with blue/purple tones.',
    description: 'Cutting-edge and innovative. Great for tech companies, startups, and digital products.',
    isDefault: false,
    isActive: true,
  },
]

/**
 * Get default styles config for a new tenant
 */
export function getDefaultImageStylesConfig(): ImageStylesConfig {
  return {
    styles: BUILTIN_IMAGE_STYLES,
    defaultStyleId: 'professional',
  }
}

/**
 * Validate image style configuration
 */
export function validateImageStyle(style: Partial<ImageStyle>): string | null {
  if (!style.name || style.name.trim().length < 2) {
    return 'Style name must be at least 2 characters'
  }
  if (!style.prompt || style.prompt.trim().length < 10) {
    return 'Style prompt must be at least 10 characters'
  }
  if (style.name.length > 50) {
    return 'Style name must be less than 50 characters'
  }
  if (style.prompt.length > 500) {
    return 'Style prompt must be less than 500 characters'
  }
  return null
}
