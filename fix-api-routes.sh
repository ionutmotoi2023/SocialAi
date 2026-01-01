#!/bin/bash

# Find all API route files
routes=$(find src/app/api -name "route.ts" -o -name "route.tsx")

for route in $routes; do
  echo "Processing $route..."
  
  # Check if file already has the dynamic export
  if grep -q "export const dynamic = 'force-dynamic'" "$route"; then
    echo "  ✓ Already has dynamic config"
  else
    # Add at the beginning of the file
    sed -i "1iexport const dynamic = 'force-dynamic'\n" "$route"
    echo "  ✓ Added dynamic config"
  fi
done

echo ""
echo "✨ All API routes fixed!"
