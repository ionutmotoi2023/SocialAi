# 🕐 CRON Job - Auto-Publishing System

## Overview
The CRON job automatically publishes scheduled posts to LinkedIn at the scheduled time.

## How It Works

1. **Vercel Cron** calls `/api/cron/publish-scheduled` every **15 minutes**
2. The endpoint finds all posts with:
   - `status = SCHEDULED`
   - `scheduledAt <= NOW()`
3. For each post:
   - Verifies LinkedIn integration is active
   - Publishes to LinkedIn using the API
   - Updates post status to `PUBLISHED`
   - Stores LinkedIn post URL
4. If publishing fails:
   - Updates post status to `FAILED`
   - Logs the error
   - (TODO: Sends email notification)

## Configuration

### Vercel Cron Setup

The cron is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/publish-scheduled",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

**Schedule:** Every 15 minutes  
**Cron Expression:** `*/15 * * * *`

### Environment Variables

Add to `.env.local` or Vercel environment:

```bash
CRON_SECRET="your-random-secret-key"
```

This prevents unauthorized access to the CRON endpoint.

## Manual Testing

You can manually trigger the CRON job for testing:

```bash
# Using curl
curl -X POST http://localhost:3000/api/cron/publish-scheduled \
  -H "Authorization: Bearer your-cron-secret"

# Using Postman
POST http://localhost:3000/api/cron/publish-scheduled
Headers:
  Authorization: Bearer your-cron-secret
```

## Response Format

### Success Response

```json
{
  "success": true,
  "timestamp": "2024-01-01T12:00:00Z",
  "results": {
    "total": 5,
    "successful": 4,
    "failed": 1,
    "successIds": ["post-id-1", "post-id-2", "post-id-3", "post-id-4"],
    "failures": [
      {
        "id": "post-id-5",
        "error": "LinkedIn token expired"
      }
    ]
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Failed to process scheduled posts",
  "message": "Database connection error"
}
```

## Monitoring

### Check CRON Logs in Vercel

1. Go to Vercel Dashboard
2. Select your project
3. Click on "Logs"
4. Filter by `/api/cron/publish-scheduled`

### Database Monitoring

Check post statuses:

```sql
-- Posts pending publishing
SELECT * FROM posts 
WHERE status = 'SCHEDULED' 
AND "scheduledAt" <= NOW();

-- Recently published posts
SELECT * FROM posts 
WHERE status = 'PUBLISHED' 
AND "publishedAt" >= NOW() - INTERVAL '1 hour';

-- Failed posts
SELECT * FROM posts 
WHERE status = 'FAILED';
```

## Error Handling

### Common Issues

#### 1. LinkedIn Token Expired
**Error:** `LinkedIn token expired`  
**Solution:** User needs to reconnect LinkedIn in Settings > Integrations

#### 2. LinkedIn API Rate Limit
**Error:** `Rate limit exceeded`  
**Solution:** Retry after the rate limit resets (usually 15 minutes)

#### 3. Invalid Post Content
**Error:** `Invalid content format`  
**Solution:** Check post content meets LinkedIn requirements

### Retry Mechanism

Currently, failed posts are marked as `FAILED` and require manual intervention.

**TODO:** Implement automatic retry with exponential backoff:
- 1st retry: 15 minutes later
- 2nd retry: 1 hour later
- 3rd retry: 24 hours later
- After 3 failed attempts: Send email notification

## Production Deployment

### Vercel

1. Deploy to Vercel: `vercel deploy --prod`
2. Vercel automatically reads `vercel.json` and sets up the cron
3. Add `CRON_SECRET` to Vercel environment variables
4. Cron jobs are only active in **production** deployments

### Alternative: Railway

If deploying to Railway instead of Vercel:

1. Use Railway Cron Jobs or node-cron
2. Create `src/lib/cron/scheduler.ts`:

```typescript
import cron from 'node-cron'

// Run every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  console.log('Running scheduled post publisher...')
  await fetch('http://localhost:3000/api/cron/publish-scheduled', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`
    }
  })
})
```

3. Install dependencies:
```bash
npm install node-cron
npm install --save-dev @types/node-cron
```

## Testing Checklist

- [ ] Create a post and schedule it for 2 minutes in the future
- [ ] Wait for CRON to run (or trigger manually)
- [ ] Verify post status changed to `PUBLISHED`
- [ ] Check post appears on LinkedIn
- [ ] Verify `publishedAt` and `linkedinPostUrl` are set
- [ ] Test with a post scheduled in the past (should publish immediately)
- [ ] Test error handling (disconnect LinkedIn and try to publish)
- [ ] Check CRON logs in Vercel dashboard

## Future Enhancements

- [ ] Email notifications for failed posts
- [ ] Automatic retry mechanism with exponential backoff
- [ ] Support for multiple social media platforms
- [ ] Optimal time suggestion based on engagement data
- [ ] Bulk scheduling with smart distribution
- [ ] CRON job health monitoring dashboard

## Security Notes

- ⚠️ Always use `CRON_SECRET` in production
- ⚠️ Never expose CRON endpoint without authentication
- ⚠️ Store sensitive tokens encrypted in database
- ⚠️ Implement rate limiting on manual triggers
- ⚠️ Log all publishing attempts for audit trail

## Support

For issues or questions:
- Email: support@mindloop.ro
- Documentation: [INSTALLATION.md](./INSTALLATION.md)
- Status: [PROGRESS_STATUS.md](./PROGRESS_STATUS.md)

---

**Made with ❤️ by AI MINDLOOP SRL | Romania 🇷🇴**
