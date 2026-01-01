// Database types from Prisma
import type { 
  User, 
  Tenant, 
  Post, 
  AIConfig, 
  BrandAsset, 
  ContentSource,
  LinkedInIntegration,
  AILearningData,
  Invitation,
  UserRole as PrismaUserRole,
  PostStatus as PrismaPostStatus,
  InvitationStatus as PrismaInvitationStatus
} from '@prisma/client'

// Re-export types
export type {
  User,
  Tenant,
  Post,
  AIConfig,
  BrandAsset,
  ContentSource,
  LinkedInIntegration,
  AILearningData,
  Invitation
}

// Re-export enums as types
export type UserRole = PrismaUserRole
export type PostStatus = PrismaPostStatus
export type InvitationStatus = PrismaInvitationStatus

// API Response types
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Auth types
export interface AuthUser {
  id: string
  email: string
  name?: string | null
  avatar?: string | null
  role: UserRole
  tenantId: string
  tenant: {
    id: string
    name: string
    domain?: string | null
    logo?: string | null
  }
}

// AI Configuration types
export interface AIModelConfig {
  model: 'gpt-4-turbo' | 'claude-3-opus' | 'gemini-pro'
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}

export interface BrandVoiceConfig {
  tone: 'professional' | 'casual' | 'enthusiastic' | 'technical'
  style: string
  keywords: string[]
  avoidWords: string[]
  examples: string[]
}

// Content generation types
export interface ContentGenerationRequest {
  mediaUrls: string[]
  prompt?: string
  brandVoice?: BrandVoiceConfig
  targetPlatform: 'linkedin' | 'twitter' | 'facebook'
  includeHashtags: boolean
  includeCTA: boolean
}

export interface GeneratedContent {
  text: string
  hashtags: string[]
  confidence: number
  aiModel: string
  generationTime: number
  suggestions?: string[]
}

// Media upload types
export interface MediaFile {
  id: string
  url: string
  filename: string
  size: number
  mimeType: string
  width?: number
  height?: number
  duration?: number
}

// Dashboard stats types
export interface DashboardStats {
  totalPosts: number
  scheduledPosts: number
  publishedPosts: number
  aiGeneratedPosts: number
  averageConfidence: number
  engagementRate: number
  timesSaved: number
}

// Learning data types
export interface LearningPattern {
  pattern: string
  frequency: number
  confidence: number
  examples: string[]
  improvement: number
}

// NextAuth type extensions
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: UserRole
      tenantId: string
      tenant: {
        id: string
        name: string
        domain?: string | null
        logo?: string | null
      }
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role: UserRole
    tenantId: string
    tenant: {
      id: string
      name: string
      domain?: string | null
      logo?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    email: string
    name?: string | null
    role: UserRole
    tenantId: string
    tenant: {
      id: string
      name: string
      domain?: string | null
      logo?: string | null
    }
  }
}