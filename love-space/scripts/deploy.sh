#!/bin/bash

# Love Space 一键部署脚本
# 使用前请确保已安装 Node.js 和 npm

set -e

echo "💕 Love Space - 一键部署脚本"
echo "================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否已登录 Cloudflare
check_cloudflare_login() {
  if ! npx wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}未检测到 Cloudflare 登录${NC}"
    echo "正在引导登录..."
    npx wrangler login
  else
    echo -e "${GREEN}✓ Cloudflare 已登录${NC}"
  fi
}

# 创建 D1 数据库
create_d1_database() {
  echo ""
  echo "📦 创建 D1 数据库..."
  DB_INFO=$(npx wrangler d1 create love-space-db 2>&1 || true)
  
  if [[ $DB_INFO == *"already exists"* ]]; then
    echo -e "${YELLOW}数据库已存在，跳过创建${NC}"
  else
    echo -e "${GREEN}✓ 数据库创建成功${NC}"
  fi
}

# 创建 R2 存储桶
create_r2_bucket() {
  echo ""
  echo "📦 创建 R2 存储桶..."
  R2_INFO=$(npx wrangler r2 bucket create love-space-media 2>&1 || true)
  
  if [[ $R2_INFO == *"already exists"* ]]; then
    echo -e "${YELLOW}存储桶已存在，跳过创建${NC}"
  else
    echo -e "${GREEN}✓ 存储桶创建成功${NC}"
  fi
}

# 初始化数据库
init_database() {
  echo ""
  echo "🗄️  初始化数据库..."
  cd worker
  npm run init-db
  cd ..
  echo -e "${GREEN}✓ 数据库初始化完成${NC}"
}

# 部署 Worker
deploy_worker() {
  echo ""
  echo "⚙️  部署 Cloudflare Worker..."
  cd worker
  npm install
  npm run deploy
  cd ..
  echo -e "${GREEN}✓ Worker 部署成功${NC}"
}

# 部署前端
deploy_frontend() {
  echo ""
  echo "🎨 部署前端应用..."
  cd frontend
  npm install
  npm run build
  
  echo ""
  echo "正在上传到 Cloudflare Pages..."
  npx wrangler pages deploy dist --project-name=love-space
  cd ..
  
  echo -e "${GREEN}✓ 前端部署成功${NC}"
}

# 生成部署报告
generate_report() {
  echo ""
  echo "================================"
  echo "🎉 部署完成!"
  echo "================================"
  echo ""
  echo "下一步操作:"
  echo "1. 访问 Cloudflare Dashboard 配置 Access 权限"
  echo "   https://one.dash.cloudflare.com/"
  echo ""
  echo "2. 配置访问策略，仅允许你和伴侣的邮箱访问"
  echo ""
  echo "3. 访问部署的网址进行初始化设置"
  echo ""
  echo "4. 邀请你的伴侣加入你们的私密空间 💕"
  echo ""
}

# 主流程
main() {
  check_cloudflare_login
  create_d1_database
  create_r2_bucket
  init_database
  deploy_worker
  deploy_frontend
  generate_report
}

# 运行主流程
main

# 部署完成提示
echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}    💕 部署成功！祝你们幸福!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
