/**
 * Next.js Instrumentation Hook
 * 
 * This file is automatically called by Next.js when the application starts.
 * We use it to initialize our cron jobs for scheduled post publishing.
 * 
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on Node.js runtime (not Edge runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 Application starting - initializing instrumentation...')
    
    // Only start cron jobs in production or when explicitly enabled
    const shouldStartCron = 
      process.env.NODE_ENV === 'production' || 
      process.env.ENABLE_CRON === 'true'

    if (shouldStartCron) {
      console.log('🕐 Starting cron jobs for scheduled posts...')
      
      // Dynamically import to avoid loading in Edge runtime
      const { startCronJobs } = await import('@/lib/cron/scheduler')
      startCronJobs()
    } else {
      console.log('⏸️  Cron jobs disabled (not in production)')
      console.log('   Set ENABLE_CRON=true to enable in development')
    }
  }
}
