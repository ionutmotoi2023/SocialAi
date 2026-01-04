#!/bin/bash

echo "🧪 Testing /api/drive-media endpoint..."
echo ""

# Test API directly (requires session cookie)
curl -s 'https://socialai.mindloop.ro/api/drive-media' \
  -H 'accept: application/json' | jq '.'

echo ""
echo "✅ Test complete!"
