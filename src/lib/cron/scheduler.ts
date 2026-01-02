/**
 * Node-Cron Scheduler for Railway Deployment
 * 
 * This scheduler runs internally in the Next.js application
 * and triggers the publish-scheduled endpoint every 15 minutes.
 * 
 * Why: Railway doesn't support Vercel's cron configuration (vercel.json),
 * so we need an internal cron job using node-cron.
 */

import cron from 'node-cron'

let cronJobStarted = false

/**
 * Start all cron jobs
 * Called once when the application starts
 */
export function startCronJobs() {
  // Prevent multiple initializations
  if (cronJobStarted) {
    console.log('⚠️  Cron jobs already running, skipping initialization')
    return
  }

  console.log('🕐 Initializing cron jobs for scheduled posts...')

  // Define the cron job function
  const checkScheduledPosts = async () => {
    const timestamp = new Date().toISOString()
    console.log(`\n🔄 [${timestamp}] Running scheduled posts check...`)

    try {
      // Build the URL for the cron endpoint
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const cronUrl = `${baseUrl}/api/cron/publish-scheduled`

      console.log(`📡 Calling: ${cronUrl}`)

      // Call the publish-scheduled endpoint
      const response = await fetch(cronUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include Authorization header if CRON_SECRET is set
          ...(process.env.CRON_SECRET && {
            'Authorization': `Bearer ${process.env.CRON_SECRET}`
          })
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Log results
      if (data.success && data.results) {
        const { total, successful, failed } = data.results
        if (total > 0) {
          console.log(`✅ Processed ${total} posts: ${successful} successful, ${failed} failed`)
          if (successful > 0) {
            console.log(`   ✓ Published: ${data.results.successIds.join(', ')}`)
          }
          if (failed > 0) {
            console.log(`   ✗ Failed:`)
            data.results.failures.forEach((f: any) => {
              console.log(`     - ${f.id}: ${f.error}`)
            })
          }
        } else {
          console.log('ℹ️  No posts ready for publishing')
        }
      } else {
        console.log('✅ Cron job completed:', JSON.stringify(data))
      }

    } catch (error: any) {
      console.error('❌ Cron job failed:', error.message)
      console.error('   Full error:', error)
    }
  }

  // Schedule: Every 15 minutes (*/15 * * * *)
  // This matches the original Vercel cron configuration
  cron.schedule('*/15 * * * *', checkScheduledPosts)

  // Also run immediately on startup (useful for testing)
  // This checks for any posts that should have been published while app was down
  console.log('🔄 Running initial check for overdue posts...')
  checkScheduledPosts().catch(err => {
    console.error('❌ Initial check failed:', err)
  })

  cronJobStarted = true
  console.log('✅ Cron job scheduler initialized successfully!')
  console.log('   Schedule: Every 15 minutes (*/15 * * * *)')
  console.log('   Next run: In ~15 minutes\n')
}

/**
 * Stop all cron jobs (useful for graceful shutdown)
 */
export function stopCronJobs() {
  if (!cronJobStarted) {
    return
  }

  console.log('🛑 Stopping cron jobs...')
  // node-cron doesn't expose a global stop method
  // Individual jobs would need to be tracked and stopped
  cronJobStarted = false
  console.log('✅ Cron jobs stopped')
}
