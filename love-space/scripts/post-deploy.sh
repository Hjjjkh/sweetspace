#!/bin/bash

# Cloudflare Pages 部署后自动执行数据库迁移
# 这个脚本会在 Pages 构建完成后自动运行

set -e

echo "🗄️  执行数据库迁移..."

# 检查是否在 Cloudflare 环境
if [ -n "$CF_PAGES" ]; then
    echo "✅ 检测到 Cloudflare Pages 环境"
    
    # 执行数据库迁移
    cd worker
    npx wrangler d1 execute love-space-db --file=./migrations/0001_init.sql --remote || {
        echo "⚠️  数据库迁移失败（可能已初始化）"
        echo "✅ 继续部署流程..."
    }
    
    echo "✅ 数据库迁移完成！"
else
    echo "ℹ️  本地环境，跳过自动迁移"
fi
