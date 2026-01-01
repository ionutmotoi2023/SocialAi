#!/bin/bash

# Script pentru eliminarea declarațiilor duplicate de 'export const dynamic'

echo "🔧 Starting duplicate removal..."

# Funcție pentru curățarea fișierului
clean_file() {
    local file="$1"
    
    # Verifică dacă există duplicate
    count=$(grep -c "export const dynamic = 'force-dynamic'" "$file" 2>/dev/null || echo "0")
    
    if [ "$count" -gt 1 ]; then
        echo "  ⚠️  Found $count occurrences in $file"
        
        # Creează backup temporar
        cp "$file" "$file.bak"
        
        # Elimină toate liniile cu 'export const dynamic'
        grep -v "export const dynamic = 'force-dynamic'" "$file.bak" > "$file.tmp"
        
        # Adaugă o singură declarație la început
        echo "export const dynamic = 'force-dynamic'" > "$file"
        echo "" >> "$file"
        cat "$file.tmp" >> "$file"
        
        # Curăță fișierele temporare
        rm "$file.bak" "$file.tmp"
        
        echo "  ✅ Fixed $file"
    fi
}

# Procesează toate API routes
echo ""
echo "📁 Processing API routes..."
for file in src/app/api/**/*.ts; do
    if [ -f "$file" ]; then
        clean_file "$file"
    fi
done

# Procesează toate paginile
echo ""
echo "📄 Processing pages..."
for file in src/app/**/page.tsx; do
    if [ -f "$file" ]; then
        clean_file "$file"
    fi
done

# Raportează rezultatul
echo ""
echo "✅ All duplicates removed!"
echo ""
echo "📊 Verification:"
echo "Files with 'export const dynamic':"
grep -r "export const dynamic" src/app/ --include="*.ts" --include="*.tsx" | wc -l

echo ""
echo "Files with duplicate declarations (should be 0):"
for file in $(find src/app -name "*.ts" -o -name "*.tsx"); do
    count=$(grep -c "export const dynamic = 'force-dynamic'" "$file" 2>/dev/null || echo "0")
    if [ "$count" -gt 1 ]; then
        echo "  ⚠️  $file: $count occurrences"
    fi
done | wc -l
