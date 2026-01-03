export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { getPlanLimits, getPlanPrice } from '@/lib/subscription-plans'


export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, companyName, website, plan } = body

    // Validate required fields
    if (!name || !email || !password || !companyName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Determine the plan (default to FREE if not specified)
    const selectedPlan = plan && ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'].includes(plan) 
      ? plan 
      : 'FREE'

    // Get plan limits and pricing
    const planLimits = getPlanLimits(selectedPlan)
    const planPrice = getPlanPrice(selectedPlan)

    // Create tenant (company)
    const tenant = await prisma.tenant.create({
      data: {
        name: companyName,
        website: website || null,
      },
    })

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user with TENANT_ADMIN role
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        emailVerified: new Date(), // Auto-verify email for direct registration
        role: 'TENANT_ADMIN',
        tenantId: tenant.id,
      },
      include: {
        tenant: true,
      },
    })

    // Create default AI configuration
    await prisma.aIConfig.create({
      data: {
        tenantId: tenant.id,
        selectedModel: 'gpt-4-turbo',
        tonePreference: 'professional',
        postLength: 'medium',
        hashtagStrategy: 'moderate',
        includeEmojis: true,
        includeCTA: true,
      },
    })

    // Create subscription with 14-day trial
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 14) // 14 days trial

    const currentPeriodStart = new Date()
    const currentPeriodEnd = new Date()
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1) // 1 month from now

    await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        plan: selectedPlan,
        status: 'TRIAL',
        amount: planPrice / 100, // Convert cents to dollars
        billingCycle: 'monthly',
        currentPeriodStart: currentPeriodStart,
        currentPeriodEnd: currentPeriodEnd,
        trialEndsAt: trialEndDate,
        // Set limits based on plan
        postsLimit: planLimits.posts,
        usersLimit: planLimits.users,
        aiCreditsLimit: planLimits.aiCredits,
        // Initialize usage at 0
        postsUsed: 0,
        usersUsed: 1, // Count the admin user
        aiCreditsUsed: 0,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenant: {
            id: tenant.id,
            name: tenant.name,
          },
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}
