#!/bin/bash

# Love Space 全自动部署脚本
# 一条命令完成所有部署！

set -e

echo "💕 Love Space - 全自动部署到 Cloudflare"
echo "=========================================="
echo ""

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 未检测到 Node.js，请先安装 Node.js 16+${NC}"
    exit 1
fi

# 安装 wrangler
echo "📦 安装 Wrangler CLI..."
npm install -g wrangler > /dev/null 2>&1
echo -e "${GREEN}✓ Wrangler 安装完成${NC}"

# 登录 Cloudflare
echo ""
echo "🔐 请登录 Cloudflare (会自动打开浏览器)..."
wrangler login
echo -e "${GREEN}✓ Cloudflare 登录成功${NC}"

# 创建 D1 数据库
echo ""
echo "🗄️  创建 D1 数据库..."
DB_ID=$(wrangler d1 create love-space-db 2>&1 | grep -oP 'database_id = "\K[^"]+' || echo "")
if [ -z "$DB_ID" ]; then
    DB_ID=$(wrangler d1 list 2>&1 | grep love-space-db | awk '{print $2}')
fi
echo -e "${GREEN}✓ 数据库 ID: $DB_ID${NC}"

# 更新 wrangler.toml
echo ""
echo "⚙️  配置 Worker..."
cat > worker/wrangler.toml <<EOF
name = "love-space-worker"
main = "src/index.js"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "love-space-db"
database_id = "$DB_ID"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "love-space-media"

[triggers]
crons = ["0 0 * * *"]

[vars]
ENVIRONMENT = "production"
CRON_SECRET = "$(openssl rand -hex 16)"
EOF
echo -e "${GREEN}✓ Worker 配置完成${NC}"

# 创建 R2 存储桶
echo ""
echo "📦 创建 R2 存储桶..."
wrangler r2 bucket create love-space-media 2>&1 | grep -v "already exists" || true
echo -e "${GREEN}✓ R2 存储桶创建完成${NC}"

# 部署 Worker
echo ""
echo "⚡ 部署 Cloudflare Worker..."
cd worker
npm install > /dev/null 2>&1
npx wrangler deploy
echo -e "${GREEN}✓ Worker 部署成功${NC}"
cd ..

# 部署前端
echo ""
echo "🎨 部署前端页面..."
cd frontend
npm install > /dev/null 2>&1
npm run build > /dev/null 2>&1
npx wrangler pages deploy dist --project-name=love-space
echo -e "${GREEN}✓ 前端部署成功${NC}"
cd ..

# 完成
echo ""
echo "=========================================="
echo -e "${GREEN}🎉 部署完成！${NC}"
echo "=========================================="
echo ""
echo "📱 访问地址:"
echo "   https://love-space.pages.dev"
echo ""
echo "🔐 下一步：配置 Access 权限"
echo "   1. 访问 https://one.dash.cloudflare.com/"
echo "   2. 进入 Access > Applications"
echo "   3. 找到 love-space 应用"
echo "   4. 添加你和伴侣的邮箱"
echo ""
echo "💡 提示：部署日志已保存到部署输出中"
echo ""
