/**
 * Image Provider Factory
 * Manages multiple image generation providers with fallback support
 */

import { ImageProvider, ImageProviderType } from './types'
import { DallE3Provider } from './dalle3'
import { FluxProProvider } from './flux-pro'
import { FluxSchnellProvider } from './flux-schnell'

class ImageProviderFactory {
  private providers: Map<ImageProviderType, ImageProvider> = new Map()

  constructor() {
    // Register all available providers
    this.registerProvider(new DallE3Provider())
    this.registerProvider(new FluxProProvider())
    this.registerProvider(new FluxSchnellProvider())
  }

  private registerProvider(provider: ImageProvider) {
    this.providers.set(provider.id as ImageProviderType, provider)
  }

  async getProvider(type: ImageProviderType): Promise<ImageProvider> {
    const provider = this.providers.get(type)
    if (!provider) {
      throw new Error(`Image provider '${type}' not found`)
    }

    const isAvailable = await provider.isAvailable()
    if (!isAvailable) {
      throw new Error(`Image provider '${type}' is not available (check API keys)`)
    }

    return provider
  }

  async getProviderWithFallback(
    preferredType: ImageProviderType,
    fallbackTypes: ImageProviderType[] = ['dalle3']
  ): Promise<ImageProvider> {
    // Try preferred provider first
    try {
      return await this.getProvider(preferredType)
    } catch (error) {
      console.warn(`⚠️ Preferred provider '${preferredType}' not available:`, error)
    }

    // Try fallback providers
    for (const fallbackType of fallbackTypes) {
      try {
        console.log(`🔄 Trying fallback provider: ${fallbackType}`)
        return await this.getProvider(fallbackType)
      } catch (error) {
        console.warn(`⚠️ Fallback provider '${fallbackType}' not available:`, error)
      }
    }

    throw new Error('No image generation providers available. Please configure API keys.')
  }

  getAllProviders(): ImageProvider[] {
    return Array.from(this.providers.values())
  }

  async getAvailableProviders(): Promise<ImageProvider[]> {
    const providers = this.getAllProviders()
    const available: ImageProvider[] = []

    for (const provider of providers) {
      if (await provider.isAvailable()) {
        available.push(provider)
      }
    }

    return available
  }
}

// Export singleton instance
export const imageProviderFactory = new ImageProviderFactory()

// Export convenience function
export async function getImageProvider(
  type: ImageProviderType = 'dalle3',
  enableFallback: boolean = true
): Promise<ImageProvider> {
  if (enableFallback) {
    return imageProviderFactory.getProviderWithFallback(type, ['flux-pro', 'flux-schnell', 'dalle3'])
  }
  return imageProviderFactory.getProvider(type)
}
