#!/bin/bash

# List of page files that need fixing
pages=(
  "src/app/page.tsx"
  "src/app/login/page.tsx"
  "src/app/register/page.tsx"
  "src/app/dashboard/page.tsx"
  "src/app/dashboard/analytics/page.tsx"
  "src/app/dashboard/autopilot/page.tsx"
  "src/app/dashboard/brand/page.tsx"
  "src/app/dashboard/calendar/page.tsx"
  "src/app/dashboard/posts/page.tsx"
  "src/app/dashboard/posts/create/page.tsx"
  "src/app/dashboard/settings/page.tsx"
  "src/app/dashboard/settings/integrations/page.tsx"
  "src/app/dashboard/team/page.tsx"
)

# For each page, check if it already has 'use client' and add dynamic config after it
for page in "${pages[@]}"; do
  if [ -f "$page" ]; then
    echo "Processing $page..."
    
    # Check if file already has the dynamic export
    if grep -q "export const dynamic = 'force-dynamic'" "$page"; then
      echo "  ✓ Already has dynamic config"
    else
      # Insert after 'use client' line if it exists
      if grep -q "'use client'" "$page"; then
        sed -i "/'use client'/a\\
\\
export const dynamic = 'force-dynamic'" "$page"
        echo "  ✓ Added dynamic config after 'use client'"
      else
        # If no 'use client', add both at the beginning
        sed -i "1i'use client'\\n\\nexport const dynamic = 'force-dynamic'\\n" "$page"
        echo "  ✓ Added 'use client' and dynamic config"
      fi
    fi
  else
    echo "⚠ File not found: $page"
  fi
done

echo ""
echo "✨ All pages fixed!"
