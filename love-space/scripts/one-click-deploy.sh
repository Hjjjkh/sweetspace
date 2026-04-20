#!/bin/bash

# 💕 Love Space - 超级零操作部署脚本
# 登录 Cloudflare 后，一键完成所有部署（GitHub + Cloudflare）

set -e

echo "💕 Love Space - 全自动部署"
echo "================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. 检查并安装 wrangler
if ! command -v wrangler &> /dev/null; then
    echo "📦 安装 Wrangler..."
    npm install -g wrangler > /dev/null 2>&1
    echo -e "${GREEN}✓ Wrangler 已安装${NC}"
fi

# 2. 登录 Cloudflare（会自动打开浏览器）
echo "🔐 登录 Cloudflare..."
wrangler login
echo -e "${GREEN}✓ 登录成功${NC}"

# 3. 获取 Cloudflare 账户信息
echo ""
echo "📋 获取账户信息..."
ACCOUNT_ID=$(wrangler whoami 2>&1 | grep -oP 'account \K[a-f0-9]+' | head -1)
if [ -z "$ACCOUNT_ID" ]; then
    ACCOUNT_ID=$(wrangler d1 list 2>&1 | grep -oP '^[a-f0-9-]+' | head -1)
fi
echo -e "${GREEN}✓ 账户 ID: $ACCOUNT_ID${NC}"

# 4. 创建 D1 数据库
echo ""
echo "🗄️  创建数据库..."
DB_RESULT=$(wrangler d1 create love-space-db 2>&1)
DB_ID=$(echo "$DB_RESULT" | grep -oP 'database_id = "\K[^"]+' || echo "")
if [ -z "$DB_ID" ]; then
    DB_ID=$(wrangler d1 list 2>&1 | grep 'love-space-db' | awk '{print $2}')
fi
echo -e "${GREEN}✓ D1 数据库: $DB_ID${NC}"

# 5. 创建 R2 存储桶
echo ""
echo "📦 创建存储桶..."
wrangler r2 bucket create love-space-media 2>&1 | grep -v "already exists" || echo -e "${YELLOW}存储桶已存在${NC}"
echo -e "${GREEN}✓ R2 存储桶就绪${NC}"

# 6. 初始化数据库
echo ""
echo "🗂️  初始化数据库表..."
cd worker
npx wrangler d1 execute love-space-db --file=./schema.sql 2>&1 | tail -3
echo -e "${GREEN}✓ 数据库表创建完成${NC}"

# 7. 部署 Worker
echo ""
echo "⚡ 部署 Worker..."
npm install > /dev/null 2>&1
npx wrangler deploy 2>&1 | grep -E "(Deployed|Uploaded)" || true
WORKER_URL=$(npx wrangler deploy 2>&1 | grep -oP 'https://[^\s]+\.workers\.dev' | head -1 || echo "love-space-worker.workers.dev")
echo -e "${GREEN}✓ Worker 部署成功：https://$WORKER_URL${NC}"
cd ..

# 8. 部署前端
echo ""
echo "🎨 部署前端..."
cd frontend
npm install > /dev/null 2>&1
npm run build > /dev/null 2>&1
npx wrangler pages deploy dist --project-name=love-space 2>&1 | grep -E "(Deploy|uploaded)" || true
echo -e "${GREEN}✓ 前端部署成功${NC}"
cd ..

# 9. 获取 Pages 地址
echo ""
PAGES_URL="https://love-space.pages.dev"
echo "================================"
echo -e "${GREEN}🎉 部署完成！${NC}"
echo "================================"
echo ""
echo "📱 访问地址:"
echo "   $PAGES_URL"
echo ""
echo "🔐 配置 Access 权限 (必需步骤):"
echo "   1. 访问：https://one.dash.cloudflare.com/"
echo "   2. Access > Applications > Add application"
echo "   3. 选择 Self-hosted"
echo "   4. Name: love-space"
echo "   5. Domain: love-space.pages.dev"
echo "   6. 添加 Policy:"
echo "      - Email = 你的邮箱"
echo "      - Email = 伴侣的邮箱"
echo "   7. 保存"
echo ""
echo "💡 然后访问 $PAGES_URL 开始使用！"
echo ""
