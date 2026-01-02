# Cloudinary Setup Guide

## Why Cloudinary?

Cloudinary is a cloud-based image and video management solution that provides:

- ✅ **Free Tier**: Generous free plan (25 GB storage, 25 GB bandwidth/month)
- ✅ **CDN**: Global CDN for fast image delivery
- ✅ **Persistent Storage**: Images are NOT deleted on redeployment
- ✅ **Public URLs**: Direct HTTPS URLs that work with OpenAI Vision API
- ✅ **Automatic Optimization**: Auto-format, quality, and compression
- ✅ **Easy Integration**: Simple API with Node.js SDK

## Setup Steps

### 1. Create Cloudinary Account

1. Go to: https://cloudinary.com/users/register/free
2. Sign up for a free account
3. Verify your email

### 2. Get Your Credentials

After signing in, you'll see your **Dashboard** with:

```
Cloud name: your-cloud-name
API Key: 123456789012345
API Secret: abcdef1234567890ABCDEF1234567890
```

### 3. Add to Railway Environment Variables

Go to your Railway project:

1. Click on your service
2. Go to **Variables** tab
3. Add these three variables:

```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdef1234567890ABCDEF1234567890
```

### 4. Redeploy

Railway will automatically redeploy your app with the new variables.

## How It Works

### Upload Flow:

1. User uploads image → Frontend sends to `/api/upload`
2. API converts image to buffer
3. Buffer is uploaded to Cloudinary
4. Cloudinary returns **public HTTPS URL**
5. URL is saved in database
6. URL is sent to OpenAI Vision API (GPT-4o)

### Example URLs:

```
Before (local): /uploads/1767334075904-nw7bl6624dg.jpg ❌
After (Cloudinary): https://res.cloudinary.com/yourcloud/image/upload/v1234567890/social-ai/image.jpg ✅
```

## Features

### Automatic Optimizations

Cloudinary automatically:
- Converts images to WebP (when supported)
- Compresses images for faster loading
- Generates responsive sizes
- Serves via CDN

### Storage Limits (Free Tier)

- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25,000/month
- **Credits**: 10,000/month

This is more than enough for development and small-medium production use!

## Testing

After setup, test the upload:

1. Go to: https://socialai-production-da70.up.railway.app/dashboard/posts/create
2. Upload an image
3. The image should now:
   - ✅ Display correctly in the preview
   - ✅ Have a Cloudinary URL (check browser DevTools)
   - ✅ Work with AI content generation

## Troubleshooting

### Error: "Image upload service not configured"

**Problem**: Cloudinary environment variables not set

**Solution**: Double-check variables in Railway:
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET

### Error: "Upload failed"

**Problem**: Invalid credentials or network issue

**Solution**: 
1. Verify credentials on Cloudinary dashboard
2. Check Railway logs: `railway logs`
3. Ensure API key is active (not disabled)

### Images not loading in GPT-4o

**Problem**: URLs might be blocked by OpenAI

**Solution**: 
- Cloudinary URLs are whitelisted by OpenAI
- Ensure you're using `secureUrl` (HTTPS)
- Check URL is publicly accessible (no authentication required)

## Alternative: Railway Volumes

If you prefer local storage:

1. Create a Railway Volume
2. Mount to `/app/uploads`
3. Modify upload API to use volume path
4. Add nginx to serve static files

**Note**: This is more complex and requires additional configuration.

## Migration from Local Storage

If you have existing local uploads:

1. Current images in `public/uploads/` will be lost on redeploy
2. New images will use Cloudinary automatically
3. Old image URLs will break (404 errors)
4. Consider re-uploading important images

## Support

- Cloudinary Docs: https://cloudinary.com/documentation
- Railway Docs: https://docs.railway.app/
- Need help? Check Railway logs for detailed error messages
