export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/brand/extract-variables - Auto-extract brand variables from scraped data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tenant info
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: {
        name: true,
        industry: true,
        description: true,
        website: true,
      },
    })

    // Get brand training data
    const brandData = await prisma.brandTrainingData.findMany({
      where: { tenantId: session.user.tenantId },
      orderBy: { lastUpdated: 'desc' },
    })

    if (brandData.length === 0) {
      return NextResponse.json(
        { error: 'No brand data found. Please scrape your website first in Brand Training tab.' },
        { status: 400 }
      )
    }

    // Extract variables from brand data
    const extractedVariables: any = {}

    // Company name from tenant
    if (tenant?.name) {
      extractedVariables.companyName = tenant.name
    }

    // Try to extract tagline from about section
    const aboutData = brandData.find(d => d.category === 'about')
    if (aboutData) {
      const content = aboutData.content
      // Look for tagline patterns
      const taglineMatch = content.match(/(?:tagline|slogan|motto)[:：]\s*([^.。\n]+)/i)
      if (taglineMatch) {
        extractedVariables.companyTagline = taglineMatch[1].trim()
      }
    }

    // Extract products/services
    const productsData = brandData.find(d => d.category === 'products')
    const servicesData = brandData.find(d => d.category === 'services')
    if (productsData || servicesData) {
      const productsText = productsData?.content || ''
      const servicesText = servicesData?.content || ''
      // Combine and limit to first 200 chars
      const combined = (productsText + ' ' + servicesText).substring(0, 300).trim()
      if (combined) {
        extractedVariables.keyProducts = combined
      }
    }

    // Extract values/mission
    const valuesData = brandData.find(d => d.category === 'values')
    if (valuesData) {
      extractedVariables.uniqueValue = valuesData.content.substring(0, 300).trim()
    }

    // Try to extract year founded
    const allContent = brandData.map(d => d.content).join(' ')
    const yearMatch = allContent.match(/(?:founded|established|since|started)(?:\s+in)?\s+(19\d{2}|20\d{2})/i)
    if (yearMatch) {
      extractedVariables.foundedYear = yearMatch[1]
    }

    // Try to extract team size
    const teamMatch = allContent.match(/(\d+[\+\-]?\s*(?:to\s+\d+)?\s*(?:employees?|team members?|people))/i)
    if (teamMatch) {
      extractedVariables.teamSize = teamMatch[1].trim()
    }

    // Try to extract headquarters
    const hqMatch = allContent.match(/(?:headquarters?|based in|located in)[:：]?\s*([^.。\n,]{3,50}(?:,\s*[A-Z]{2})?)/i)
    if (hqMatch) {
      extractedVariables.headquarters = hqMatch[1].trim()
    }

    // Try to extract target audience from industry
    if (tenant?.industry) {
      extractedVariables.targetAudience = `${tenant.industry} companies and organizations`
    }

    return NextResponse.json({
      success: true,
      extractedVariables,
      message: `Extracted ${Object.keys(extractedVariables).length} variables from brand data`,
    })
  } catch (error: any) {
    console.error('Extract variables error:', error)
    return NextResponse.json(
      { error: 'Failed to extract brand variables' },
      { status: 500 }
    )
  }
}
