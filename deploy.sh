#!/bin/bash

# CIRY Production Deployment Script
# Usage: ./deploy.sh

set -e  # Exit on error

echo "🚀 Starting CIRY Production Deployment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Create database backup
echo -e "${YELLOW}📦 Step 1: Creating database backup...${NC}"
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
pg_dump $DATABASE_URL > $BACKUP_FILE
if [ -f "$BACKUP_FILE" ]; then
    echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
    ls -lh $BACKUP_FILE
else
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
fi
echo ""

# Step 2: Pull latest code
echo -e "${YELLOW}📥 Step 2: Pulling latest code from GitHub...${NC}"
git pull origin main
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Code updated${NC}"
else
    echo -e "${RED}❌ Git pull failed!${NC}"
    exit 1
fi
echo ""

# Step 3: Install dependencies
echo -e "${YELLOW}📦 Step 3: Installing dependencies...${NC}"
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ npm install failed!${NC}"
    exit 1
fi
echo ""

# Step 4: Build application
echo -e "${YELLOW}🔨 Step 4: Building application...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completed${NC}"
else
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi
echo ""

# Step 5: Database migration
echo -e "${YELLOW}🗄️  Step 5: Running database migration...${NC}"
npm run db:push
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database migration completed${NC}"
else
    echo -e "${YELLOW}⚠️  Database migration had warnings (this may be normal)${NC}"
fi
echo ""

# Step 6: Restart PM2
echo -e "${YELLOW}🔄 Step 6: Restarting PM2 application...${NC}"
pm2 restart credactive
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PM2 restarted${NC}"
else
    echo -e "${RED}❌ PM2 restart failed!${NC}"
    exit 1
fi
echo ""

# Step 7: Check PM2 status
echo -e "${YELLOW}📊 Step 7: Checking PM2 status...${NC}"
pm2 status credactive
echo ""

# Step 8: Wait for startup
echo -e "${YELLOW}⏳ Step 8: Waiting for application startup (10 seconds)...${NC}"
sleep 10
echo ""

# Step 9: Health check
echo -e "${YELLOW}🏥 Step 9: Running health check...${NC}"
HEALTH_RESPONSE=$(curl -s https://ciry.app/api/health)
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
    echo "$HEALTH_RESPONSE"
else
    echo -e "${RED}❌ Health check failed!${NC}"
    echo "Response: $HEALTH_RESPONSE"
    echo ""
    echo -e "${YELLOW}📋 Recent logs:${NC}"
    pm2 logs credactive --lines 50 --nostream
    exit 1
fi
echo ""

# Step 10: Check scheduler logs
echo -e "${YELLOW}📋 Step 10: Checking scheduler initialization...${NC}"
pm2 logs credactive --lines 100 --nostream | grep -E "LoginLogsScheduler|WearableScheduler" || true
echo ""

# Success message
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Don't forget to purge Cloudflare cache!${NC}"
echo ""
echo "Next steps:"
echo "1. Go to Cloudflare Dashboard"
echo "2. Select your domain"
echo "3. Caching → Configuration → Purge Everything"
echo ""
echo -e "${GREEN}Backup saved: $BACKUP_FILE${NC}"
echo -e "${GREEN}Application URL: https://ciry.app${NC}"
echo ""
echo "Monitor logs with: pm2 logs credactive"
echo ""
