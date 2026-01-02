#!/bin/bash

# 🔍 LinkedIn OAuth Configuration Tester
# Acest script verifică dacă toate variabilele sunt setate corect

echo "🔍 Verificare Configurare LinkedIn OAuth"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ -f .env.local ]; then
    source .env.local
    echo "✅ Fișier .env.local găsit"
else
    echo -e "${YELLOW}⚠️  Fișier .env.local nu există (normal pentru Railway)${NC}"
fi

echo ""
echo "📋 Variabile de Mediu:"
echo "----------------------"

# Check NEXTAUTH_URL
if [ -z "$NEXTAUTH_URL" ]; then
    echo -e "${RED}❌ NEXTAUTH_URL - NU E SETAT${NC}"
else
    echo -e "${GREEN}✅ NEXTAUTH_URL${NC} = $NEXTAUTH_URL"
    
    # Check if it ends with /login (which is wrong)
    if [[ "$NEXTAUTH_URL" == *"/login" ]]; then
        echo -e "${RED}   ⚠️  PROBLEMĂ: URL-ul se termină cu /login (trebuie șters!)${NC}"
    fi
fi

# Check LINKEDIN_CLIENT_ID
if [ -z "$LINKEDIN_CLIENT_ID" ]; then
    echo -e "${RED}❌ LINKEDIN_CLIENT_ID - NU E SETAT${NC}"
else
    echo -e "${GREEN}✅ LINKEDIN_CLIENT_ID${NC} = $LINKEDIN_CLIENT_ID"
fi

# Check LINKEDIN_CLIENT_SECRET
if [ -z "$LINKEDIN_CLIENT_SECRET" ]; then
    echo -e "${RED}❌ LINKEDIN_CLIENT_SECRET - NU E SETAT${NC}"
else
    SECRET_LENGTH=${#LINKEDIN_CLIENT_SECRET}
    if [ $SECRET_LENGTH -lt 10 ]; then
        echo -e "${YELLOW}⚠️  LINKEDIN_CLIENT_SECRET = ${NC}****** (prea scurt - $SECRET_LENGTH caractere)"
        echo -e "${YELLOW}   Ar trebui să aibă minimum 16 caractere${NC}"
    else
        echo -e "${GREEN}✅ LINKEDIN_CLIENT_SECRET${NC} = ****** ($SECRET_LENGTH caractere)"
    fi
fi

echo ""
echo "🔗 URL-uri Generate:"
echo "--------------------"

if [ ! -z "$NEXTAUTH_URL" ]; then
    REDIRECT_URI="${NEXTAUTH_URL}/api/integrations/linkedin/callback"
    AUTH_URL="${NEXTAUTH_URL}/api/integrations/linkedin/auth"
    
    echo -e "${GREEN}Auth URL:${NC} $AUTH_URL"
    echo -e "${GREEN}Callback URL:${NC} $REDIRECT_URI"
    echo ""
    echo "📝 Acest URL trebuie adăugat în LinkedIn Developer App:"
    echo "   → https://www.linkedin.com/developers/apps"
    echo "   → Auth → Authorized redirect URLs:"
    echo "   → $REDIRECT_URI"
else
    echo -e "${RED}❌ Nu pot genera URL-uri (NEXTAUTH_URL lipsă)${NC}"
fi

echo ""
echo "🎯 Verificări Suplimentare:"
echo "---------------------------"

# Check if running in Railway
if [ ! -z "$RAILWAY_ENVIRONMENT" ]; then
    echo -e "${GREEN}✅ Rulează în Railway${NC}"
    echo "   Environment: $RAILWAY_ENVIRONMENT"
else
    echo -e "${YELLOW}⚠️  Nu rulează în Railway (development local?)${NC}"
fi

# Check LinkedIn App Requirements
echo ""
echo "📋 Checklist LinkedIn Developer App:"
echo "-------------------------------------"
echo "□ Client ID corespunde: 77n8woevltj8fw"
echo "□ Client Secret este setat în Railway Variables"
echo "□ Redirect URI este adăugat în LinkedIn App"
echo "□ Products aprobate:"
echo "  □ Sign In with LinkedIn"
echo "  □ Share on LinkedIn"
echo "□ Status aplicație: 'In Development' sau 'Verified'"
echo ""

# Test endpoint
echo "🧪 Testare Endpoint (dacă serverul rulează):"
echo "---------------------------------------------"

if [ ! -z "$NEXTAUTH_URL" ]; then
    # Try to ping the health endpoint
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${NEXTAUTH_URL}/api/health" 2>/dev/null)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Server răspunde${NC} (HTTP $HTTP_CODE)"
    elif [ "$HTTP_CODE" = "000" ]; then
        echo -e "${YELLOW}⚠️  Server nu răspunde (offline sau URL greșit)${NC}"
    else
        echo -e "${YELLOW}⚠️  Server răspunde cu HTTP $HTTP_CODE${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Nu pot testa (NEXTAUTH_URL lipsă)${NC}"
fi

echo ""
echo "📚 Documentație:"
echo "----------------"
echo "Pentru mai multe detalii, vezi:"
echo "  • LINKEDIN_FIX_GUIDE.md"
echo "  • LINKEDIN_INTEGRATION.md"
echo ""
echo "========================================"
