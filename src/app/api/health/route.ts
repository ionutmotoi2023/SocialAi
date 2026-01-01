export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check database connection
    // const isDbConnected = await checkDatabaseConnection()
    
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected', // Replace with actual check
          redis: 'connected',     // Replace with actual check
          ai: 'available',        // Replace with actual check
        },
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Service check failed',
      },
      { status: 503 }
    )
  }
}