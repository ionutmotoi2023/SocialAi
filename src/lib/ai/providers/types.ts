/**
 * Image Generation Provider Types
 * Abstraction layer for multiple AI image generation services
 */

export interface ImageGenerationParams {
  prompt: string
  size?: string // e.g., '1024x1024', '1:1', etc.
  quality?: 'standard' | 'hd'
  style?: 'vivid' | 'natural'
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  numInferenceSteps?: number // For diffusion models
  guidanceScale?: number // For diffusion models
  seed?: number // For reproducibility
}

export interface GeneratedImageResult {
  url: string
  revisedPrompt?: string
  width?: number
  height?: number
  format?: string
  provider: string
  model: string
  generationTime?: number // milliseconds
  cost?: number // USD
}

export interface ImageProvider {
  name: string
  id: string
  generate(params: ImageGenerationParams): Promise<GeneratedImageResult>
  isAvailable(): Promise<boolean>
}

export type ImageProviderType = 
  | 'dalle3'
  | 'flux-pro'
  | 'flux-schnell'
  | 'flux-dev'
  | 'sdxl'
  | 'leonardo'
