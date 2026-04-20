#!/bin/bash

# 💕 Love Space - 数据库一键初始化脚本
# 运行此脚本自动初始化数据库

set -e

echo "💕 Love Space - 数据库初始化"
echo "================================"
echo ""

# 检查 wrangler 是否安装
if ! command -v wrangler &> /dev/null; then
    echo "📦 安装 Wrangler..."
    npm install -g wrangler
fi

# 登录 Cloudflare
echo ""
echo "🔐 登录 Cloudflare..."
wrangler login

# 初始化数据库
echo ""
echo "🗄️  初始化数据库表..."
cd worker
npx wrangler d1 execute love-space-db --file=./schema.sql --remote

echo ""
echo "✅ 数据库初始化完成！"
echo ""
echo "验证：访问 https://sweetspace.248851185.pages.dev"
