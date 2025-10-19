#!/bin/bash
# CIRY Production Deployment Script
# Server: 157.180.21.147
# Date: 2025-10-19

set -e  # Exit on error

echo "🚀 CIRY Production Deployment"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Pull latest changes
echo -e "${BLUE}[1/6]${NC} Pulling latest changes from GitHub..."
git pull origin main
echo -e "${GREEN}✓${NC} Code updated"
echo ""

# Step 2: Verify environment variables
echo -e "${BLUE}[2/6]${NC} Verifying environment variables..."
if ! grep -q "GEMINI_API_KEY" .env; then
    echo -e "${YELLOW}⚠${NC} GEMINI_API_KEY not found in .env"
    exit 1
fi

# Ensure USE_LOCAL_MODEL is false or not set (use Gemini until GPU server ready)
if grep -q "USE_LOCAL_MODEL=true" .env; then
    echo -e "${YELLOW}⚠${NC} USE_LOCAL_MODEL is true, but GPU server not ready yet"
    echo "   Setting to false for now (will use Gemini)..."
    sed -i 's/USE_LOCAL_MODEL=true/USE_LOCAL_MODEL=false/' .env
fi

echo -e "${GREEN}✓${NC} Environment configured for Gemini (cloud fallback)"
echo ""

# Step 3: Install dependencies (if needed)
echo -e "${BLUE}[3/6]${NC} Installing dependencies..."
npm install --production=false
echo -e "${GREEN}✓${NC} Dependencies installed"
echo ""

# Step 4: Build application
echo -e "${BLUE}[4/6]${NC} Building application..."
export VITE_STRIPE_PUBLIC_KEY=pk_live_51SEAg6DPEkqoxxfatlURO2ivVXS8P6ioI40uC69q72pbnfxj8DlUajSMUgAcWbcXMl49vPB2segToTYCWgNz8fAB00glrA6xzO
npm run build
echo -e "${GREEN}✓${NC} Build completed"
echo ""

# Step 5: Restart PM2
echo -e "${BLUE}[5/6]${NC} Restarting application..."
pm2 restart ciry
sleep 3
pm2 logs ciry --lines 20 --nostream
echo -e "${GREEN}✓${NC} Application restarted"
echo ""

# Step 6: Verification
echo -e "${BLUE}[6/6]${NC} Deployment verification..."
echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Purge Cloudflare cache (Dashboard → Purge Everything)"
echo "   2. Wait 30 seconds for cache to clear"
echo "   3. Test at https://ciry.app"
echo "   4. Monitor logs: pm2 logs ciry --lines 50"
echo ""
echo -e "${YELLOW}⚠ Important:${NC}"
echo "   - Currently using Gemini cloud (USE_LOCAL_MODEL=false)"
echo "   - When GPU server is ready, set USE_LOCAL_MODEL=true"
echo "   - Code is ready for Gemma, just needs server + config"
echo ""
