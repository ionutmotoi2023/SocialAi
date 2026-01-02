#!/bin/bash

# Test Cloudinary Configuration
# This script checks if Cloudinary is properly configured

echo "🔍 Testing Cloudinary Configuration..."
echo ""

# Check if environment variables are set
if [ -z "$CLOUDINARY_CLOUD_NAME" ]; then
    echo "❌ CLOUDINARY_CLOUD_NAME is not set"
    MISSING=1
else
    echo "✅ CLOUDINARY_CLOUD_NAME: ${CLOUDINARY_CLOUD_NAME:0:5}..."
fi

if [ -z "$CLOUDINARY_API_KEY" ]; then
    echo "❌ CLOUDINARY_API_KEY is not set"
    MISSING=1
else
    echo "✅ CLOUDINARY_API_KEY: ${CLOUDINARY_API_KEY:0:5}..."
fi

if [ -z "$CLOUDINARY_API_SECRET" ]; then
    echo "❌ CLOUDINARY_API_SECRET is not set"
    MISSING=1
else
    echo "✅ CLOUDINARY_API_SECRET: ${CLOUDINARY_API_SECRET:0:5}..."
fi

echo ""

if [ "$MISSING" == "1" ]; then
    echo "❌ Some Cloudinary variables are missing!"
    echo ""
    echo "Please add them to Railway:"
    echo "1. Go to Railway Dashboard"
    echo "2. Select your project"
    echo "3. Click 'Variables' tab"
    echo "4. Add the missing variables"
    echo ""
    echo "Get credentials from: https://console.cloudinary.com/"
    exit 1
else
    echo "✅ All Cloudinary variables are configured!"
    echo ""
    echo "Next steps:"
    echo "1. Test image upload at: https://socialai.mindloop.ro/dashboard/posts/create"
    echo "2. Upload an image"
    echo "3. Generate content with GPT-4 Vision"
    exit 0
fi
